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
let gthis = null; // pointer to "this" from SchellenbergBridge

const CommandFactory = require("./comunication/CommandFactory");
const AllNewDeviceInfos = require("./comunication/comModel/responseBody/AllNewDeviceInfos");
const JSONResponse = require("./comunication/comModel/JSONResponse");
const DeviceValue = require("./comunication/comModel/responseBody/DeviceValue");
const SmartSocketFactory = require("./comunication/SmartSocketFactory");
const commonDefines = require("./helpers/CommonDefines");
const SchellenbergDevice = require("./SchellenbergDevice");

class SchellenbergBridge {
	constructor(that) {
		gthat = that;
		gthis = this;
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
	}

	async Connect() {
		SmartSocketFactory.default.createSocketAndLogin(gthat, this.ip, this.port, "CA.pem", this.username, this.password, this.cSymbol, this.shcVersion, this.shApiVersion, this, true)
			.then(returnedSocket => {
				this.socket = returnedSocket;
				if (this.socket && this.loginResponse) {
					gthat.setAdapterConnectionState(true);

					gthat.log.info("Querying all devices...");
					const command = CommandFactory.default.createAllNewInfoCmd(this.lastTimestamp, this.compatibilityConfigurationVersion, this.languageTranslationVersion);
					return this.socket.sendAndRecieveCommand(command, this.loginResponse.sessionID);
				}
			})
			.then(response => {
				if (response && response.response) {
					const parsedResponse = AllNewDeviceInfos.default.fromObject(response.response);
					this.processAllNewDeviceInfos(parsedResponse);
				}
			});
	}

	async processAllNewDeviceInfos(response) {
		const newDeviceInfos = response.newDeviceInfos.values;
		const compatibilityConfigurationVersion = response.newCompatibilityConfiguration;
		gthat.log.silly("Received all devices:\r\n" + JSON.stringify(newDeviceInfos) + "\r\n-------\r\n" + JSON.stringify(compatibilityConfigurationVersion));

		for (let i = 0; i < newDeviceInfos.length; i++) {
			const device = newDeviceInfos[i];

			if(device.deviceName.includes(commonDefines.KnownDeviceTypes.AwningEngine.name)) {
				await this.createDevice(device);
			}
		}
	}

	async createDevice(device) {
		const newDevice = new SchellenbergDevice.SchellenbergDevice(gthat);

		newDevice.platform = gthis;
		newDevice.id = device.deviceID;
		newDevice.name = device.deviceName;
		newDevice.typeClient = device.deviceTypClient;
		newDevice.designation = device.deviceDesignation;

		await newDevice.CreateAndSave();
	}

	handleDisconnect() {
		gthat.log.debug("Handle Disconnect was called. Rejecting all queued Promises");
		this.promiseQueue.forEach((entry) => {
			entry.reject("Socket Disconnected");
		});
	}

	handleMessage(data) {
		if (data) {
			const parsedResponse = JSONResponse.default.fromJSONString(data);
			if (parsedResponse.currentTimestamp) {
				gthat.log.debug("Updated timestamp to " + parsedResponse.currentTimestamp);
				this.lastTimestamp = parsedResponse.currentTimestamp;
			}
			switch (parsedResponse.responseCode) {
				case -1:
					this.rejectNextPromise(parsedResponse);
					break;
				case 1:
					this.resolveNextPromise(parsedResponse);
					break;
				case 2:
					this.handleUpdate(parsedResponse);
					break;
				case 5:
					// Message Boxes and Disconnect because of login
					gthat.log.warn("Connection was closed because credentials were used to login on a different device (e.g. official app). Reconnecting...");
					gthat.setAdapterConnectionState(false);
					this.handleDisconnect();
					setTimeout(() => this.Connect(), 2000);
					break;
				case 8:
					// Ignore as it's just an empty message after disconnect because of responseCode=5
					break;
				default:
					gthat.log.warn("Unknown message response code: " + parsedResponse.responseCode + " - Please report this to the developer!");
					break;
			}
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

			const gatewayPrefix = commonDefines.AdapterDatapointIDs.Gateway + ".";
			await gthat.setStateAsync(gatewayPrefix + commonDefines.AdapterStateIDs.HardwareName, this.loginResponse.hardware, true);
			await gthat.setStateAsync(gatewayPrefix + commonDefines.AdapterStateIDs.MacAddress, this.loginResponse.macAddress, true);
		}
		else {
			gthat.log.error("Missing parameters in Login Message - Please report this to the developer");
		}
	}

	handleNewDeviceValue(response) {
	}

	sendCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			this.socket.sendJSONCommand(command, this.loginResponse.sessionID);
		}
		else {
			gthat.log.warn("Login to the gateway was not successful yet. Ignoring command.");
		}
	}

	sendAndReceiveCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			return this.socket.sendAndRecieveCommand(command, this.loginResponse.sessionID);
		}
		else {
			gthat.log.warn("Login to the gateway was not successful yet. Ignoring command.");
		}
	}

	handleUpdate(response) {
		if (response.responseMessage) {
			switch (response.responseMessage) {
				case "newDeviceValue":
					const responseNewDeviceValue = this.handleNewDeviceValue(DeviceValue.default.fromObject(response.response));
					break;
				case "newDeviceInfo":
					break;
				default:
					break;
			}
		}
	}
}
exports.SchellenbergBridge = SchellenbergBridge;