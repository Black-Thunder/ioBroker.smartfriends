"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
const DeviceInfo = require("./DeviceInfo");
class NewDeviceInfos {
	constructor(values) {
		this.values = values;
	}
	static fromObject(object) {
		const tempValues = [];
		for (const valueEntry of object) {
			tempValues.push(DeviceInfo.default.fromObject(valueEntry));
		}
		return new NewDeviceInfos(tempValues);
	}
}
exports.default = NewDeviceInfos;