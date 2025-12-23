"use strict";

exports.AdapterDatapointIDs = Object.freeze({
	Info: "info",
	Gateway: "gateway",
	Devices: "devices",
	Control: "control",
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
	Position: "position",
});
