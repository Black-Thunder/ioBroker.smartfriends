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

exports.DeviceCommands = Object.freeze({
	MoveDown: { name: "MoveDown", value: 1 },
	MoveUp: { name: "MoveUp", value: 2 },
	MoveStop: { name: "MoveStop", value: 0 },
	UNDEF: { name: "UndefinedCommand", value: -1 }
});
