"use strict";

exports.AdapterDatapointIDs = Object.freeze({
	Info: "info",
	Gateway: "gateway",
	Devices: "devices",
	Control: "control"
});

exports.AdapterStateIDs = Object.freeze({
	// info
	Connection: "connection",
	DeviceName: "deviceName",
	// gateway
	HardwareName: "hardwareName",
	MacAddress: "macAddress",
	// devices.XXX.info
	TypeClient: "typeClient",
	Designation: "designation",
	// devices.XXX.control
	MoveUp: "moveUp",
	MoveDown: "moveDown",
	MoveStop: "moveStop"
});

exports.KnownDeviceTypes = Object.freeze({
	AwningEngine: { name: "Markisenantrieb Plus", type: "${Awning}" }
});

exports.decrypt = function(key, value) {
	let result = "";
	for (let i = 0; i < value.length; ++i) {
		result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
	}
	return result;
};

