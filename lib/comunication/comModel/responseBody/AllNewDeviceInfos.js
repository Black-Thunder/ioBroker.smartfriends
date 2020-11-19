"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for Response answers
//--------------------------------------------------
const JSONHelper = require("../JSONHelper.js");
const NewCompatibilityConfiguration = require("./NewCompatibilityConfiguration.js");
const NewDeviceInfos = require("./NewDeviceInfos.js");
const NewDeviceValues = require("./NewDeviceValues.js");
const NewLanguageTranslation = require("./NewLanguageTranslation.js");
class AllNewDeviceInfos {
	constructor(currentTimestamp, newCompatibilityConfiguration, newDeviceInfos, newDeviceValues, newLanguageTranslation) {
		this.currentTimestamp = currentTimestamp;
		this.newCompatibilityConfiguration = newCompatibilityConfiguration;
		this.newDeviceInfos = newDeviceInfos;
		this.newDeviceValues = newDeviceValues;
		this.newLanguageTranslations = newLanguageTranslation;
	}
	static fromObject(object) {
		return new AllNewDeviceInfos(JSONHelper.default.stringToDate(object.currentTimestamp), NewCompatibilityConfiguration.default.fromObject(object.newCompatibilityConfiguration), NewDeviceInfos.default.fromObject(object.newDeviceInfos), NewDeviceValues.default.fromObject(object.newDeviceValues), NewLanguageTranslation.default.fromObject(object.newLanguageTranslation));
	}
}
exports.default = AllNewDeviceInfos;