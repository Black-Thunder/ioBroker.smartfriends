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
		role: "level.temperature",
		desc: "Measured temperature",
		unit: "°C",
		defaultMin: -90,
		defaultMax: 60,
		defaultStep: 0.5,
	},
	volume: {
		role: "value.rain",
		desc: "Measured rain volume",
		unit: "mm",
		defaultMin: 0,
		defaultMax: 350,
		defaultStep: 1,
	},
	// generic sensor kind for different types of weather sensors (e.g. atmospheric pressure, wind speed, etc.)
	weather: {
		role: "value",
		desc: "Measured value",
		unit: "",
	},
};

/**
 * Declarative registry for device kinds that provide
 * an alarm information
 */
const AlarmKinds = {
	failureStatus: {
		role: "value",
		desc: "Error code of the device",
	},
};

module.exports = {
	AlarmKinds,
	LevelKinds,
	SensorKinds,
};
