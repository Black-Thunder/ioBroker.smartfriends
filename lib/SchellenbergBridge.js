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

class SchellenbergBridge {
	constructor(that) {
		gthat = that;
		gthis = this;
		this.ip = that.config.smartFriendsIP;
		this.port = that.config.smartFriendsPort;
		this.username = that.config.smartFriendsUsername;
		this.password = that.config.smartFriendsPassword;
		this.promiseQueue = [];
		this.lastTimestamp = new Date(0);
		this.compatibilityConfigurationVersion = "0";
		this.languageTranslationVersion = "0";
	}

	async Connect(callback) {
		SmartSocketFactory.default.createSocketAndLogin(this.ip, this.port, "CA.pem", this.username, this.password, "D19033i", "2.15.0", "2.15", this, true)
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
					gthat.log.silly("Received all devices:\r\n" + JSON.stringify(parsedResponse.newDeviceInfos) + "\r\n-------\r\n" + JSON.stringify(parsedResponse.newCompatibilityConfiguration));
				}
			});
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
				gthat.log.debug("Updated Timestamp to " + parsedResponse.currentTimestamp);
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
					//Message Boxes and Disconnect because of login. So FIXME
					break;
				default:
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
			gthat.log.error("Missing parameters in Login Message. Cannot continue, exiting.");
			this.requestExit();
		}
	}
	handleNewDeviceValue(response) {
	}
	sendCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			this.socket.sendJSONCommand(command, this.loginResponse.sessionID);
		}
	}
	sendAndReceiveCommand(command) {
		if (this.socket && this.loginResponse && this.loginResponse.sessionID) {
			return this.socket.sendAndRecieveCommand(command, this.loginResponse.sessionID);
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
	requestExit() {
	}
}
exports.SchellenbergBridge = SchellenbergBridge;