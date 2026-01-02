"use strict";

const { LevelKinds, SensorKinds, AlarmKinds } = require("./DeviceCapabilityRegistry");

/**
 * Resolves capabilities from a SmartFriends device definition
 */
function getDeviceCapabilities(definition) {
	const deviceType = definition?.deviceType ?? {};
	const kind = deviceType.kind ?? "unknown";
	const deviceDesignation = definition?.deviceDesignation?.replace(/\${|}/g, "") ?? kind;
	const model = deviceType.model ?? "unknown";

	const switchingValues = Array.isArray(deviceType.switchingValues) ? deviceType.switchingValues : [];

	const hasSwitchingValues = switchingValues.length > 0;
	let configObj = {
		kind,
		name: deviceDesignation,
	};

	const levelConfig = LevelKinds[kind] ?? null;
	const sensorConfig = (SensorKinds[kind] && model == "analog") ?? null; // only sensor type "analog" contains measurable values
	const alarmConfig = AlarmKinds[kind] ?? null;

	if (levelConfig) {
		configObj = {
			...configObj,
			role: levelConfig.role,
			desc: levelConfig.desc,
			unit: levelConfig.unit,
			min: deviceType.min ?? levelConfig.defaultMin,
			max: deviceType.max ?? levelConfig.defaultMax,
			step: deviceType.step ?? levelConfig.defaultStep,
		};
	} else if (sensorConfig) {
		configObj = {
			...configObj,
			role: sensorConfig.role,
			desc: sensorConfig.desc,
			unit: sensorConfig.unit,
			min: deviceType.min ?? sensorConfig.defaultMin,
			max: deviceType.max ?? sensorConfig.defaultMax,
			step: deviceType.step ?? sensorConfig.defaultStep,
		};
	} else if (alarmConfig) {
		configObj = {
			...configObj,
			role: alarmConfig.role,
			desc: alarmConfig.desc,
		};

		// map "textOptions" (if present) into configObj as enumerated states
		if (deviceType.textOptions && Array.isArray(deviceType.textOptions) && deviceType.textOptions.length > 0) {
			configObj.states = deviceType.textOptions.reduce((acc, opt) => {
				acc[opt.value] = `${opt.state} (${opt.name.replace(/\${|}/g, "")})`;
				return acc;
			}, {});
		}
	}

	return {
		// state creation decision
		shouldBeCreated: hasSwitchingValues || !!levelConfig || !!sensorConfig || !!alarmConfig,
		hasWritableStates: hasSwitchingValues || !!levelConfig,
		// metadata for builders
		hasSwitchingValues,
		hasLevel: !!levelConfig,
		hasSensor: !!sensorConfig,
		hasAlarm: !!alarmConfig,
		// config object for state creation
		configObj: configObj,
	};
}

module.exports = {
	getDeviceCapabilities,
};
