"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
const DeviceValue = require("./DeviceValue");
class NewDeviceValues {
	constructor(values) {
		this.values = values;
	}
	static fromObject(object) {
		const tempValues = [];
		for (const valueEntry of object) {
			tempValues.push(DeviceValue.default.fromObject(valueEntry));
		}
		return new NewDeviceValues(tempValues);
	}
}
exports.default = NewDeviceValues;