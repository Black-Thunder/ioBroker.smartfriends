"use strict";

const maxRetries = 3; // number of connection retries when connection was lost
const reconnectInterval = 10 * 1000; // time (in ms) after which a single new reconnection try should be made
const retryInterval = 30 * 60 * 1000; // time (in ms) after which new reconnection tries should be made

const commonDefines = require("./helpers/CommonDefines");
const CommandFactory = require("./comunication/CommandFactory");
const AllNewDeviceInfos = require("./comunication/comModel/responseBody/AllNewDeviceInfos");
const JSONResponse = require("./comunication/comModel/JSONResponse");
const SmartSocketFactory = require("./comunication/SmartSocketFactory");
const CommonDefines = require("./helpers/CommonDefines");
const DeviceManager = require("./devices/DeviceManager");
const { SchellenbergMasterDevice } = require("./devices/SchellenbergMasterDevice");
const { getDeviceCapabilities } = require("./devices/DeviceKindCapabilities");
const { ResponseCodes, ErrorCodes, NonRetryableErrorCodes } = require("./comunication/SmartFriendsProtocolCodes");

class SchellenbergBridge {
	constructor(adapter, credentials) {
		this.adapter = adapter;
		this.ip = adapter.config.smartFriendsIP;
		this.port = adapter.config.smartFriendsPort;
		this.username = credentials.login;
		this.password = credentials.password;
		this.cSymbol = adapter.config.smartFriendsCSymbol;
		this.shcVersion = adapter.config.smartFriendsShcVersion;
		this.shApiVersion = adapter.config.smartFriendsShApiVersion;
		this.ignoreSslErrors = adapter.config.ignoreSslErrors || false;
		this.promiseQueue = [];
		this.lastTimestamp = new Date(0);
		this.compatibilityConfigurationVersion = "0";
		this.languageTranslationVersion = "0";
		this.retryCounter = 0;
		this.deviceManager = new DeviceManager(this.adapter);
		this.deviceDefinitions = [];
		this.connectionStatus = commonDefines.ConnectionStatus.IDLE;
	}

	async Connect() {
		if (this.connectionStatus === commonDefines.ConnectionStatus.CONNECTING) {
			return;
		}
		this.connectionStatus = commonDefines.ConnectionStatus.CONNECTING;

		try {
			const socket = await SmartSocketFactory.default.createSocketAndLogin(
				this.adapter,
				this.ip,
				this.port,
				"CA.pem",
				this.username,
				this.password,
				this.cSymbol,
				this.shcVersion,
				this.shApiVersion,
				this,
				true,
				this.ignoreSslErrors,
			);
			this.socket = socket;
			if (!this.socket || !this.loginResponse) {
				throw new Error("Invalid socket or login response");
			}

			this.retryCounter = 0;
			this.connectionStatus = commonDefines.ConnectionStatus.CONNECTED;
			this.adapter.setAdapterConnectionState(true);

			this.adapter.log.info("Connected successfully. Querying all devices...");
			const command = CommandFactory.default.createAllNewInfoCmd(
				this.lastTimestamp,
				this.compatibilityConfigurationVersion,
				this.languageTranslationVersion,
			);
			const response = await this.socket.sendAndReceiveCommand(command, this.loginResponse.sessionID);

			if (!response?.response) {
				return;
			}

			const allNewDeviceInfosParsed = AllNewDeviceInfos.default.fromObject(response.response);
			this.processCompatibilityConfiguration(allNewDeviceInfosParsed);
			await this.processAllNewDeviceInfos(allNewDeviceInfosParsed);
			this.processInitialDeviceValues(allNewDeviceInfosParsed);
		} catch (err) {
			const msg = err?.responseMessage || err.message || JSON.stringify(err);
			const errorCode = err?.response?.errorCode;

			this.adapter.log.error(`Connection failed: ${msg}`);
			this.connectionStatus = commonDefines.ConnectionStatus.IDLE;

			if (NonRetryableErrorCodes.has(errorCode)) {
				this.retryCounter = 0;
				this.adapter.log.warn(
					"Automatic reconnect stopped because the gateway rejected the configured login parameters.",
				);
				return;
			}

			this.scheduleReconnect();
		}
	}

	updateTimestamp(parsed) {
		if (parsed.currentTimestamp) {
			this.lastTimestamp = parsed.currentTimestamp;
			this.adapter.log.debug(`Updated timestamp to ${this.lastTimestamp}`);
		}
	}

	processCompatibilityConfiguration(parsed) {
		if (this.deviceDefinitions?.length) {
			return;
		}

		const standards = parsed.newCompatibilityConfiguration?.compatibleRadioStandards ?? [];
		this.deviceDefinitions = [];

		for (const standard of standards) {
			for (const def of standard.compatibleDevices ?? []) {
				if (def.deviceDesignation) {
					this.deviceDefinitions.push(def);
				}
			}
		}

		this.adapter.log.debug(`Loaded ${this.deviceDefinitions.length} device definitions`);
	}

	processInitialDeviceValues(parsed) {
		const values = parsed.newDeviceValues?.values ?? [];

		for (const value of values) {
			this.handleDeviceValue(value);
		}
	}

	handleDeviceValue(deviceValue) {
		if (!deviceValue || deviceValue.deviceID == null) {
			this.adapter.log.debug("Invalid device value received, ignoring.");
			return;
		}

		this.adapter.log.debug(`Device value update: deviceID=${deviceValue.deviceID}, value=${deviceValue.value}`);

		this.deviceManager.updateDeviceValue(deviceValue);
	}

	handleDeviceInfo(deviceInfo) {
		if (!deviceInfo || !deviceInfo.deviceName || !deviceInfo.deviceDesignation) {
			this.adapter.log.debug("Invalid device info received, ignoring.");
			return;
		}

		this.adapter.log.debug(`New device info received for deviceID=${deviceInfo.deviceID}`);
		// TODO: implement updates of device info if needed
	}

	async processAllNewDeviceInfos(response) {
		try {
			const deviceInfos = response.newDeviceInfos?.values ?? [];
			const createdMasters = [];

			// 1️⃣ Group child devices by master ID
			const deviceInfosByMaster = {};
			for (const deviceInfo of deviceInfos) {
				// Assign device definition dynamically
				deviceInfo.definition = this.deviceDefinitions.find(
					d => d.deviceDesignation === deviceInfo.deviceDesignation,
				);

				if (!deviceInfo.definition) {
					this.adapter.log.debug(
						`Skipping device ${deviceInfo.deviceName} (${deviceInfo.deviceDesignation}) – no definition found`,
					);
					continue;
				}

				const masterId = deviceInfo.masterDeviceID || deviceInfo.deviceID;
				if (!deviceInfosByMaster[masterId]) {
					deviceInfosByMaster[masterId] = [];
				}
				deviceInfosByMaster[masterId].push(deviceInfo);
			}

			// 2️⃣ Create master devices
			for (const [masterId, childDeviceInfos] of Object.entries(deviceInfosByMaster)) {
				const masterName = (childDeviceInfos[0].masterDeviceName || childDeviceInfos[0].deviceName).replace(
					/\${|}/g,
					"",
				);
				const masterDevice = new SchellenbergMasterDevice(this.adapter, masterId, masterName, []);

				// 3️⃣ Create child devices under the master device
				for (const childDeviceInfo of childDeviceInfos) {
					this.adapter.log.debug(
						`Getting device capabilites from definition: ${JSON.stringify(childDeviceInfo.definition)}`,
					);
					const capabilities = getDeviceCapabilities(childDeviceInfo.definition);

					// Only devices with definable states ae created
					if (!capabilities.shouldBeCreated) {
						this.adapter.log.debug(
							`Skipping device ${childDeviceInfo.deviceName} (${childDeviceInfo.deviceDesignation}) – no definable states found`,
						);
						continue;
					} else {
						this.adapter.log.debug(
							`Device ${childDeviceInfo.deviceID}: kind=${childDeviceInfo.definition.deviceType.kind}, capabilities=${JSON.stringify(capabilities)}`,
						);
					}

					const childDevice = await this.deviceManager.createDevice({
						id: childDeviceInfo.deviceID,
						name: childDeviceInfo.deviceName.replace(/\${|}/g, ""),
						deviceType:
							childDeviceInfo.deviceTypClient ?? childDeviceInfo.definition.deviceType?.kind ?? "unknown",
						designation: childDeviceInfo.deviceDesignation,
						definition: childDeviceInfo.definition,
						masterPrefix: `${commonDefines.AdapterDatapointIDs.Devices}.${masterId}`, // States unter Master-Ordner
					});

					masterDevice.childDevices.push(childDevice);
					this.adapter.log.info(
						`Device created: ${childDeviceInfo.deviceName} (ID: ${childDeviceInfo.deviceID})`,
					);
				}

				if (masterDevice.childDevices?.length !== 0) {
					await masterDevice.createMasterFolder();
					createdMasters.push(masterDevice);
				}
			}

			this.adapter.log.info(
				`Processed ${deviceInfos.length} device(s), created ${createdMasters.length} master device(s).`,
			);
		} catch (error) {
			this.adapter.log.error(`Error processing devices: ${error.message}`);
		}
	}

	async handleDeviceUpdate(deviceUpdate) {
		try {
			await this.deviceManager.updateDevice(deviceUpdate.id, deviceUpdate);
		} catch (error) {
			this.adapter.log.error(`Error updating device: ${error.message}`);
		}
	}

	handleDisconnect(manual = false) {
		if (
			!manual &&
			(this.connectionStatus === commonDefines.ConnectionStatus.WAITING_RETRY ||
				this.connectionStatus === commonDefines.ConnectionStatus.CONNECTING)
		) {
			return;
		}

		this.adapter.log.debug("handleDisconnect() was called. Rejecting all queued promises and stopping keep alive.");

		this.adapter.setAdapterConnectionState(false);
		this.connectionStatus = commonDefines.ConnectionStatus.IDLE;

		this.promiseQueue.forEach(entry => {
			entry.reject(new Error("Socket disconnected"));
		});
		this.promiseQueue = [];

		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}

		if (this.reconnectTimer) {
			this.adapter.clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		this.loginResponse = null;

		if (!manual) {
			this.scheduleReconnect();
		}
	}

	handleMessage(data) {
		if (!data) {
			return;
		}

		let parsedResponse;

		try {
			parsedResponse = JSONResponse.default.fromJSONString(data);
		} catch (e) {
			this.adapter.log.warn(`Invalid JSON message ignored: ${e.message}`);
			return;
		}

		if (parsedResponse == null || parsedResponse.responseCode == null) {
			this.adapter.log.debug("Invalid message received. Skipping...");
			return;
		}

		this.adapter.log.debug(
			`Message received: ${parsedResponse.responseMessage} (code: ${parsedResponse.responseCode})`,
		);

		this.handleResponseCode(parsedResponse);
	}

	handleResponseCode(parsedResponse) {
		const responseHandlers = {
			[ResponseCodes.ERROR]: r => this.handleErrorResponse(r),

			[ResponseCodes.SUCCESS]: r => {
				this.resolveNextPromise(r);
				this.updateTimestamp(r);
			},

			[ResponseCodes.UPDATE]: r => this.handleUpdate(r),

			[ResponseCodes.NOTIFICATION]: r => this.handleSpecificResponseCode(r, ResponseCodes.NOTIFICATION),

			[ResponseCodes.TLS_CONNECTION_CLOSED]: _r =>
				this.reconnectWithWarn("TLS/SSL connection to the gateway has been closed."),

			[ResponseCodes.CONNECTION_TIMEOUT]: _r => this.reconnectWithWarn("Connection to the gateway timed out."),

			[ResponseCodes.NEW_COMPATIBILITY_CONFIGURATION]: _r => {},
			[ResponseCodes.NEW_LICENSE]: _r => {},
			[ResponseCodes.DISCONNECT_FINISHED]: _r => {},
			[ResponseCodes.SHOW_MODULE_INFO]: _r => {},
			[ResponseCodes.REMOTE_HOME_CONNECTION_FAILED]: _r => {},
			[ResponseCodes.LOGIN_FINISHED]: _r => {},
			[ResponseCodes.HOST_NOT_FOUND]: _r => {},
			[ResponseCodes.CONNECTION_REFUSED]: _r => {},
			[ResponseCodes.LOGIN_FINISHED_ALT]: _r => {},
			[ResponseCodes.CONNECTION_TIMEOUT_INFO]: _r => {},
		};

		const handler = responseHandlers[parsedResponse.responseCode];

		if (handler) {
			handler(parsedResponse);
		} else {
			this.adapter.log.warn(
				`Unknown message response code: ${parsedResponse.responseCode} ` +
					`(message: '${parsedResponse.responseMessage}') - Please report this to the developer!`,
			);
		}
	}

	handleSpecificResponseCode(parsedResponse, codeNumber) {
		const message = String(parsedResponse.responseMessage || "").toLowerCase();
		const isParallelLoginMessage = message.includes("mit dem gleichen login angemeldet");

		switch (codeNumber) {
			case ResponseCodes.NOTIFICATION:
				if (!isParallelLoginMessage) {
					return;
				}

				this.adapter.log.warn(
					"Connection was closed, because credentials were used to login on a different device or the official app.",
				);

				this.scheduleReconnect();
				break;
		}
	}

	handleErrorResponse(parsedResponse) {
		const errorCode = parsedResponse?.response?.errorCode;

		switch (errorCode) {
			case ErrorCodes.INVALID_CREDENTIALS:
				if (parsedResponse?.response?.remainingBlockDuration) {
					this.adapter.log.error(
						`Login to the gateway is currently blocked. Please try again in ${parsedResponse.response.remainingBlockDuration} second(s)`,
					);
				}
				break;

			case ErrorCodes.INVALID_CONNECTION_PARAMETERS:
				this.adapter.log.error(
					"Login rejected by the gateway. Please verify the configured connection parameters, especially the configured CSymbol (usually includes a trailing letter).",
				);
				break;

			default:
				this.adapter.log.error(
					`Gateway returned error (responseCode ${ResponseCodes.ERROR}, errorCode ${errorCode}): ${parsedResponse.responseMessage}`,
				);
				break;
		}

		this.rejectNextPromise(parsedResponse);
	}

	reconnectWithWarn(message) {
		this.adapter.log.warn(message);
		this.handleDisconnect();
	}

	scheduleReconnect() {
		if (this.connectionStatus === commonDefines.ConnectionStatus.WAITING_RETRY) {
			return;
		}

		const delay = this.retryCounter < maxRetries ? reconnectInterval : retryInterval;

		if (this.retryCounter < maxRetries) {
			this.retryCounter++;
		}

		this.connectionStatus = commonDefines.ConnectionStatus.WAITING_RETRY;

		this.adapter.log.warn(
			this.retryCounter <= maxRetries
				? `Reconnecting (try ${this.retryCounter} of ${maxRetries})...`
				: `Gateway offline. Retrying in ${delay / 60000} minutes.`,
		);

		if (this.reconnectTimer) {
			this.adapter.clearTimeout(this.reconnectTimer);
		}

		this.reconnectTimer = this.adapter.setTimeout(() => {
			this.reconnectTimer = null;
			this.Connect();
		}, delay);
	}

	queueUpPromise(promise) {
		this.promiseQueue.push(promise);
	}

	rejectNextPromise(reason) {
		if (this.promiseQueue.length > 0) {
			const promise = this.promiseQueue.shift();
			if (promise) {
				promise.reject(reason);
			}
		}
	}

	resolveNextPromise(response) {
		if (this.promiseQueue.length > 0) {
			const promise = this.promiseQueue.shift();
			if (promise) {
				promise.resolve(response);
			}
		}
	}

	async handleLoginMessage(response) {
		if (response.sessionID && response.hardware && response.macAddress && response.shsVersion) {
			this.adapter.log.debug(`Connection and login to gateway ${response.hardware} successful.`);
			this.loginResponse = response;
			this.retryCounter = 0;

			const gatewayPrefix = `${CommonDefines.AdapterDatapointIDs.Gateway}.`;
			await this.adapter.setStateAsync(
				gatewayPrefix + CommonDefines.AdapterStateIDs.HardwareName,
				this.loginResponse.hardware,
				true,
			);
			await this.adapter.setStateAsync(
				gatewayPrefix + CommonDefines.AdapterStateIDs.MacAddress,
				this.loginResponse.macAddress,
				true,
			);
		} else {
			this.adapter.log.error("Missing parameters in Login Message - Please report this to the developer!");
		}
	}

	sendCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			this.socket.sendJSONCommand(command, this.loginResponse.sessionID);
		} else {
			this.adapter.log.error("Login to the gateway was not successful yet. Ignoring command.");
		}
	}

	sendAndReceiveCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			return this.socket.sendAndReceiveCommand(command, this.loginResponse.sessionID);
		}

		this.adapter.log.error("Login to the gateway was not successful yet. Ignoring command.");
	}

	handleUpdate(response) {
		if (response && response.response && response.responseMessage) {
			if (response.responseMessage === "newDeviceInfo") {
				this.updateTimestamp(response);
				this.handleDeviceInfo(response.response);
			} else if (response.responseMessage === "newDeviceValue") {
				this.updateTimestamp(response);
				this.handleDeviceValue(response.response);
			}
		}
	}
}
exports.SchellenbergBridge = SchellenbergBridge;
