"use strict";

/**
 * Declarative registry for device kinds that provide
 * a level-like control (position, brightness, etc.)
 */
const LevelKinds = {
	position: {
		role: "level.blind",
		desc: "Position of the device",
		unit: "%",
		defaultMin: 0,
		defaultMax: 100,
		defaultStep: 1,
	},
	brightness: {
		role: "level.dimmer",
		desc: "Brightness of the device",
		unit: "%",
		defaultMin: 0,
		defaultMax: 100,
		defaultStep: 1,
	},
};

/**
 * Declarative registry for device kinds that provide
 * a sensor state information (temperature, rain, etc.)
 */
const SensorKinds = {
	thermometer: {
		role: "value.temperature",
		desc: "Measured temperature",
		unit: "°C",
		defaultMin: -90,
		defaultMax: 60,
		defaultStep: 0.5,
	},
	luminanceDetector: {
		role: "value.brightness ",
		desc: "Measured brightness",
		unit: "lux",
		defaultMin: 0,
		defaultMax: 150000,
		defaultStep: 1,
	},
	volume: {
		role: "value.rain",
		desc: "Measured rain volume",
		unit: "mm",
		defaultMin: 0,
		defaultMax: 350,
		defaultStep: 1,
	},
	batteryLevel: {
		role: "value.battery",
		desc: "Battery level",
		unit: "%",
		defaultMin: 0,
		defaultMax: 100,
		defaultStep: 1,
	},
	// some devices are defined as "kind": "default", so this is a fallback
	// generic sensor kind for different types of sensors (e.g. atmospheric pressure, wind speed, etc.)
	genericSensor: {
		kind: "measuredValue",
		role: "value",
		desc: "Measured value",
		unit: "",
	},
};

/**
 * Declarative registry for device kinds that provide
 * an enumerated information
 */
const EnumStateKinds = {
	failureStatus: {
		role: "value",
		desc: "Error code of the device",
	},
	smokeDetector: {
		role: "sensor.alarm.fire",
		desc: "Smoke detector state",
	},
	signal: {
		kind: "rssi", // rename to make the purpose of the state clearer
		role: "value",
		desc: "Signal strength (RSSI)",
	},
	floodDetector: {
		role: "sensor.alarm.flood",
		desc: "Flood detector state",
	},
	genericEnum: {
		role: "value",
		desc: "Enumerated state",
	},
};

/**
 * Declarative registry for device kinds that provide thermostat controls
 */
const ThermostatKinds = {
	thermostat: {
		kind: "targetTemperature", // rename to make the purpose of the state clearer
		role: "level.temperature",
		desc: "Target temperature",
		unit: "°C",
		defaultMin: 5,
		defaultMax: 28,
		defaultStep: 0.5,
	},
};

module.exports = {
	LevelKinds,
	SensorKinds,
	EnumStateKinds,
	ThermostatKinds,
};
