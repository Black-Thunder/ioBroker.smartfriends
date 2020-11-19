"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
const JSONHelper = require("../JSONHelper.js");
class DeviceValue {
	constructor(deviceID, masterDeviceID, value, valueTimestamp) {
		this.deviceID = deviceID;
		this.masterDeviceID = masterDeviceID;
		this.value = value;
		this.valueTimestamp = valueTimestamp;
	}
	static fromObject(object) {
		return new DeviceValue(object.deviceID, object.masterDeviceID, object.value, JSONHelper.default.stringToDate(object.valueTimestamp));
	}
}
exports.default = DeviceValue;