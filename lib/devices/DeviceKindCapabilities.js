"use strict";

const { resolveEnumKind } = require("./EnumKindResolver");
const { LevelKinds, SensorKinds, EnumStateKinds, ThermostatKinds } = require("./DeviceCapabilityRegistry");

/**
 * Resolves capabilities from a SmartFriends device definition
 */
function getDeviceCapabilities(definition) {
	if (!definition?.deviceType) {
		return {
			shouldBeCreated: false,
			hasWritableStates: false,
			configObj: null,
		};
	}

	const deviceType = definition.deviceType;
	const kind = deviceType.kind ?? "unknown";
	const model = deviceType.model ?? "unknown";
	const type = deviceType.type;
	const name = (definition.deviceDesignation ?? kind).replace(/\${|}/g, "");
	const configObj = { kind, name };

	// SwitchingValues → always win
	const switchingValues = Array.isArray(deviceType.switchingValues) ? deviceType.switchingValues : [];
	const hasSwitchingValues = switchingValues.length > 0;

	// Level actuators
	const levelConfig = LevelKinds[kind] ?? null;

	// Thermostat
	const thermostatConfig = type === "actuator" && model === "analog" ? (ThermostatKinds[kind] ?? null) : null;

	// Analog sensors
	let sensorConfig = null;
	if (type === "sensor" && model === "analog") {
		sensorConfig = SensorKinds[kind] ?? SensorKinds.genericSensor;
	}

	// Enum sensors (textOptions)
	let enumStateConfig = null;
	if (
		type === "sensor" &&
		model === "text" &&
		Array.isArray(deviceType.textOptions) &&
		deviceType.textOptions.some(opt => opt && typeof opt === "object" && "name" in opt)
	) {
		const enumKind = resolveEnumKind(definition, deviceType);
		const baseEnumConfig = EnumStateKinds[enumKind] ?? EnumStateKinds.genericEnum;

		const isBooleanEnum =
			deviceType.textOptions.length === 2 && deviceType.textOptions.every(opt => typeof opt.value === "boolean");

		enumStateConfig = {
			...baseEnumConfig,
			type: isBooleanEnum ? "boolean" : "number",
			kind: baseEnumConfig.kind ?? enumKind,
		};
	}

	if (levelConfig) {
		Object.assign(configObj, {
			kind: levelConfig.kind ?? configObj.kind,
			role: levelConfig.role,
			desc: levelConfig.desc,
			unit: levelConfig.unit,
			min: deviceType.min ?? levelConfig.defaultMin,
			max: deviceType.max ?? levelConfig.defaultMax,
			step: deviceType.step ?? levelConfig.defaultStep,
		});
	} else if (thermostatConfig) {
		Object.assign(configObj, {
			kind: thermostatConfig.kind ?? configObj.kind,
			role: thermostatConfig.role,
			desc: thermostatConfig.desc,
			unit: thermostatConfig.unit,
			min: deviceType.min ?? thermostatConfig.defaultMin,
			max: deviceType.max ?? thermostatConfig.defaultMax,
			step: deviceType.step ?? thermostatConfig.defaultStep,
		});
	} else if (sensorConfig) {
		Object.assign(configObj, {
			kind: sensorConfig.kind ?? configObj.kind,
			role: sensorConfig.role,
			desc: sensorConfig.desc,
			unit: sensorConfig.unit,
			min: deviceType.min ?? sensorConfig.defaultMin,
			max: deviceType.max ?? sensorConfig.defaultMax,
			// leave out step for sensors as this leads to rounded values in ioBroker
		});
	} else if (enumStateConfig) {
		Object.assign(configObj, {
			type: enumStateConfig.type ?? "number",
			kind: enumStateConfig.kind ?? configObj.kind,
			role: enumStateConfig.role,
			desc: enumStateConfig.desc,
			states: deviceType.textOptions.reduce((acc, opt) => {
				acc[opt.value] = opt.name.replace(/\${|}/g, "");
				return acc;
			}, {}),
		});
	}

	return {
		// state creation decision
		shouldBeCreated:
			hasSwitchingValues || !!levelConfig || !!thermostatConfig || !!sensorConfig || !!enumStateConfig,
		hasWritableStates: hasSwitchingValues || !!levelConfig || !!thermostatConfig,
		// metadata for builders
		hasSwitchingValues,
		hasLevel: !!levelConfig,
		hasThermostat: !!thermostatConfig,
		hasSensor: !!sensorConfig,
		hasEnumState: !!enumStateConfig,
		// config object for state creation
		configObj: configObj,
	};
}

module.exports = {
	getDeviceCapabilities,
};
