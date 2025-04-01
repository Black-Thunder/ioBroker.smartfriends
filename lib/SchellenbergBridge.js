"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Handles incoming messages from a SmartSocket and
//emits Events defined in helpers/Events
//This is an exmaple Class that implements the DataDelegateInterface which is required by the Socket
//Implement an App in this Fashion
//--------------------------------------------------

let gthat = null; // pointer to "this" from main.js/SchellenbergBridge instance
const maxRetries = 3; // number of connection retries when connection was lost
const reconnectInterval = 10 * 1000; // time (in ms) after which a single new reconnection try should be made
const retryInterval = 30 * 60 * 1000; // time (in ms) after which new reconnection tries should be made

const CommandFactory = require("./comunication/CommandFactory");
const AllNewDeviceInfos = require("./comunication/comModel/responseBody/AllNewDeviceInfos");
const JSONResponse = require("./comunication/comModel/JSONResponse");
const SmartSocketFactory = require("./comunication/SmartSocketFactory");
const CommonDefines = require("./helpers/CommonDefines");
const DeviceManager = require("./DeviceManager");

class SchellenbergBridge {
	constructor(that) {
		gthat = that;
		this.ip = that.config.smartFriendsIP;
		this.port = that.config.smartFriendsPort;
		this.username = that.config.smartFriendsUsername;
		this.password = that.config.smartFriendsPassword;
		this.cSymbol = that.config.smartFriendsCSymbol;
		this.shcVersion = that.config.smartFriendsShcVersion;
		this.shApiVersion = that.config.smartFriendsShApiVersion;
		this.promiseQueue = [];
		this.lastTimestamp = new Date(0);
		this.compatibilityConfigurationVersion = "0";
		this.languageTranslationVersion = "0";
		this.retryCounter = 0;
		this.stopRenewal = false;
		this.deviceManager = new DeviceManager(gthat);
	}

	async Connect() {
		try {
			const socket = await SmartSocketFactory.default.createSocketAndLogin(gthat, this.ip, this.port, "CA.pem", this.username, this.password, this.cSymbol, this.shcVersion, this.shApiVersion, this, true);
			this.socket = socket;
			if (!this.socket || !this.loginResponse) {
				throw new Error("Invalid socket or login response");
			}

			gthat.setAdapterConnectionState(true);
			gthat.log.info("Querying all devices...");

			const command = CommandFactory.default.createAllNewInfoCmd(this.lastTimestamp, this.compatibilityConfigurationVersion, this.languageTranslationVersion);
			const response = await this.socket.sendAndRecieveCommand(command, this.loginResponse.sessionID);

			if (response?.response) {
				const parsedResponse = AllNewDeviceInfos.default.fromObject(response.response);
				await this.processAllNewDeviceInfos(parsedResponse);
			}
		} catch (err) {
			gthat.log.error(`Connection failed: ${err.message}`);
			this.handleDisconnect();
		}
	}

	async processAllNewDeviceInfos(response) {
		try {
			const newDeviceInfos = response.newDeviceInfos.values;
			const compatibilityConfigurationVersion = response.newCompatibilityConfiguration.compatibilityConfigurationVersion;
			let knownDevices = 0;

			gthat.log.silly(`Received all devices:\r\n${JSON.stringify(newDeviceInfos)}\r\n-------\r\n${JSON.stringify(compatibilityConfigurationVersion)}`);


			for (const device of response.newDeviceInfos.values) {
				if (device.deviceTypClient.includes(CommonDefines.KnownDeviceTypes.AwningEngine.type) || device.deviceTypClient.includes(CommonDefines.KnownDeviceTypes.RollingShutter.type)) {
					knownDevices++;
					await this.deviceManager.createDevice({
						id: device.deviceID,
						name: device.deviceName,
						deviceType: device.deviceTypClient,
						designation: device.deviceDesignation,
					});
				}
			}

			gthat.log.info(`Processed ${newDeviceInfos.length} device(s) and added ${knownDevices} device(s). Adapter successfully started.`);
		} catch (error) {
			gthat.log.error(`Error processing devices: ${error.message}`);
		}
	}

	async handleDeviceUpdate(deviceUpdate) {
		try {
			await this.deviceManager.updateDevice(deviceUpdate.id, deviceUpdate);
		} catch (error) {
			gthat.log.error(`Error updating device: ${error.message}`);
		}
	}

	handleDisconnect() {
		gthat.setAdapterConnectionState(false);
		gthat.log.debug("Handle Disconnect was called. Rejecting all queued promises and stopping keep alive.");
		this.promiseQueue.forEach((entry) => {
			entry.reject("Socket disconnected");
		});

		this.stopRenewal = true;
		if (this.socket) {
			this.socket.stopKeepAlive();
			this.socket = null;
		}
	}

	handleMessage(data) {
		if (data) {
			const parsedResponse = JSONResponse.default.fromJSONString(data);

			if (parsedResponse == null || parsedResponse.responseCode == null) {
				gthat.log.debug("Invalid message received. Skipping...");
				return;
			}

			if (parsedResponse.currentTimestamp) {
				gthat.log.debug(`Updated timestamp to ${parsedResponse.currentTimestamp}`);
				this.lastTimestamp = parsedResponse.currentTimestamp;
			}

			switch (parsedResponse.responseCode) {
				case -1:
					this.rejectNextPromise(parsedResponse);
					break;
				case 1:
					this.retryCounter = 0;
					this.resolveNextPromise(parsedResponse);
					break;
				case 2:
					this.handleUpdate(parsedResponse);
					break;
				// Message boxes and disconnections because of multiple login attempts
				case 5:
					// Ignore warnings when licenses are expiring soon
					if (parsedResponse.responseMessage.toLowerCase().includes("folgende lizenzen")) {
						gthat.log.error("Licenses are expiring soon. Check official app for details. Can't continue!");
						this.handleDisconnect();
						break;
					}

					// Update messages
					if (parsedResponse.responseMessage.toLowerCase().includes("update")) {
						gthat.log.error("Either update for SmartFriendsBox required or connection parameters are outdated. Please use the official app and check the adapter settings.");
						this.handleDisconnect();
						break;
					}

					// Disconnect because of login
					gthat.log.warn("Connection was closed, because credentials were used to login on a different device or the official app.");
					this.reconnect();
					break;

				case 84:
					gthat.log.warn("The TLS/SSL connection to the gateway has been closed.");
					this.reconnect();
					break;
				case 91:
					gthat.log.warn("Connection to the gateway timed out.");
					this.reconnect();
					break;
				case 8: // Ignore as it's just an empty message after disconnect because of responseCode=5
				case 20: // Ignore as it's just an empty message after successful login (message: 'loginFinished')
				case 203: // Ignore as it's just an status message for RemoteHome connection (official cloud service)
					break;
				default:
					gthat.log.error(`Unknown message response code: ${parsedResponse.responseCode} (message: '${parsedResponse.responseMessage}') - Please report this to the developer!`);
					break;
			}
		}
	}

	reconnect() {
		gthat.setAdapterConnectionState(false);

		if (this.retryCounter < maxRetries) {
			this.retryCounter++;
			gthat.log.warn(`Reconnecting (try ${this.retryCounter} of ${maxRetries})...`);
			setTimeout(() => this.Connect(), reconnectInterval);
		}
		else {
			gthat.log.warn(`Connection to gateway lost, connection temporarily disabled! Trying again in ${retryInterval / (60 * 1000)} minutes.`);
			setTimeout(() => this.Connect(), retryInterval);
		}
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
			gthat.log.debug("Connection and login to gateway successful.");
			this.loginResponse = response;
			this.retryCounter = 0;

			const gatewayPrefix = `${CommonDefines.AdapterDatapointIDs.Gateway}.`;
			await gthat.setStateAsync(gatewayPrefix + CommonDefines.AdapterStateIDs.HardwareName, this.loginResponse.hardware, true);
			await gthat.setStateAsync(gatewayPrefix + CommonDefines.AdapterStateIDs.MacAddress, this.loginResponse.macAddress, true);
		}
		else {
			gthat.log.error("Missing parameters in Login Message - Please report this to the developer!");
		}
	}

	sendCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			this.socket.sendJSONCommand(command, this.loginResponse.sessionID);
		}
		else {
			gthat.log.error("Login to the gateway was not successful yet. Ignoring command.");
		}
	}

	sendAndReceiveCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			return this.socket.sendAndRecieveCommand(command, this.loginResponse.sessionID);
		}
		else {
			gthat.log.error("Login to the gateway was not successful yet. Ignoring command.");
		}
	}

	handleUpdate(response) {
		if (response.responseMessage) {
			switch (response.responseMessage) {
				case "newDeviceValue":
					break;
				case "newDeviceInfo":
					break;
				default:
					break;
			}
		}
	}

	renewSocket(reason) {
		if (this.stopRenewal) return;

		gthat.log.warn(`Socket renewal was requested with reason: ${reason}`);
		setTimeout(() => {
			this.Connect();
		}, 1000);
	}
}
exports.SchellenbergBridge = SchellenbergBridge;
