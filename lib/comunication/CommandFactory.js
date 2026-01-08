"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Uses Command Wrapper to generate JSON-Commands

const JSONCommand = require("./comModel/JSONCommand.js");
const JSONHelper = require("./comModel/JSONHelper.js");

class CommandFactory {
	static createLoginCommand(username, digest, cSymbol, shcVersion, shApiVersion) {
		return new LoginCommand(username, digest, cSymbol, shcVersion, shApiVersion);
	}

	static createAllNewInfoCmd(timestamp, compatibilityConfigurationVersion, languageTranslationVersion) {
		return new allNewInfoCommand(
			JSONHelper.default.dateToString(timestamp),
			compatibilityConfigurationVersion,
			languageTranslationVersion,
		);
	}

	static createSetDeviceValueCmd(inDeviceId, inValue) {
		return new setDeviceValueCommand(inDeviceId, inValue);
	}

	static createupdateAllDeviceValues() {
		return new JSONCommand.default("keepalive");
	}

	static createGetComptibilityConfigurationCmd() {
		return new JSONCommand.default("getCompatibilityConfiguration");
	}

	static createLogoutCmd() {
		return new JSONCommand.default("logout");
	}

	static createKeepAliveCmd() {
		return new JSONCommand.default("keepalive");
	}

	static createHeloCmd(username) {
		return new heloCommand(username);
	}
}
exports.default = CommandFactory;

class heloCommand extends JSONCommand.default {
	constructor(username) {
		super("helo");
		this.username = username;
	}
}
exports.heloCommand = heloCommand;

class LoginCommand extends JSONCommand.default {
	constructor(username, digest, cSymbol, shcVersion, shApiVersion) {
		super("login");
		this.username = username;
		this.digest = digest;
		this.cSymbol = cSymbol;
		this.shcVersion = shcVersion;
		this.shApiVersion = shApiVersion;
	}
}
exports.LoginCommand = LoginCommand;

class allNewInfoCommand extends JSONCommand.default {
	constructor(timestamp, compatibilityConfigurationVersion, languageTranslationVersion) {
		super("getAllNewInfos", 15000); // higher timeout as this command might take longer to receive a response
		this.timestamp = timestamp;
		this.compatibilityConfigurationVersion = compatibilityConfigurationVersion;
		this.languageTranslationVersion = languageTranslationVersion;
	}
}
exports.allNewInfoCommand = allNewInfoCommand;

class setDeviceValueCommand extends JSONCommand.default {
	constructor(deviceID, value) {
		super("setDeviceValue");
		this.deviceID = deviceID;
		this.value = value;
	}
}
exports.setDeviceValueCommand = setDeviceValueCommand;
