"use strict";

const { normalizeDeviceDefinition, decodeUnicodeString } = require("../helpers/DeviceDefinitions");
const { getDeviceCapabilities } = require("./DeviceKindCapabilities");
const commonDefines = require("../helpers/CommonDefines");

class SchellenbergDevice {
	constructor(adapter) {
		this.adapter = adapter;
		this.rawDefinition = null;
		this.normalizedDefinition = null;

		// Info
		this.id = -1;
		this.name = "";
		this.deviceType = "";
		this.designation = "";
	}

	SetDefinition(definition) {
		this.rawDefinition = definition;
		this.normalizedDefinition = normalizeDeviceDefinition(definition, this.adapter.FORBIDDEN_CHARS) ?? definition;
	}

	// Creates all necessery states and channels and writes the values into the DB
	async CreateAndSave(masterPrefix) {
		// Dynamically from device.definition
		const capabilities = getDeviceCapabilities(this.normalizedDefinition);

		let devicePrefix = masterPrefix
			? `${masterPrefix}.${this.id}`
			: `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}`;

		devicePrefix = devicePrefix.replace(this.adapter.FORBIDDEN_CHARS, "");

		// Umlauts are Unicode-escaped and need to be parsed here
		await this.adapter.setObjectNotExistsAsync(devicePrefix, {
			type: "channel",
			common: {
				name: decodeUnicodeString(this.name),
			},
			native: {},
		});

		//#region INFO
		let infoPrefix = `${devicePrefix}.${commonDefines.AdapterDatapointIDs.Info}`;
		await this.adapter.setObjectNotExistsAsync(infoPrefix, {
			type: "channel",
			common: {
				name: "Device information",
			},
			native: {},
		});

		infoPrefix += ".";

		await this.adapter.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, {
			type: "state",
			common: {
				name: "Device name",
				type: "string",
				role: "info.name",
				read: true,
				write: false,
				def: this.name,
				desc: "Device name",
			},
			native: {},
		});

		await this.adapter.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.Designation, {
			type: "state",
			common: {
				name: "Device designation",
				type: "string",
				role: "text",
				read: true,
				write: false,
				def: this.designation,
				desc: "Device designation",
			},
			native: {},
		});

		await this.adapter.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, {
			type: "state",
			common: {
				name: "Device type client",
				type: "string",
				role: "text",
				read: true,
				write: false,
				def: this.deviceType,
				desc: "Device type client",
			},
			native: {},
		});

		if (capabilities.hasSensor) {
			await this.createSensorState(infoPrefix, capabilities.configObj);
		}

		if (capabilities.hasEnumState) {
			await this.createEnumState(infoPrefix, capabilities.configObj);
		}
		//#endregion

		//#region CONTROL
		if (capabilities.hasWritableStates) {
			let controlPrefix = `${devicePrefix}.${commonDefines.AdapterDatapointIDs.Control}`;

			await this.adapter.setObjectNotExistsAsync(controlPrefix, {
				type: "channel",
				common: {
					name: "Device control",
				},
				native: {},
			});

			controlPrefix += ".";

			if (capabilities.hasSwitchingValues) {
				await this.createSwitchStates(controlPrefix);
			}

			if (capabilities.hasLevel) {
				await this.createLevelState(controlPrefix, capabilities.configObj);
			}

			if (capabilities.hasThermostat) {
				await this.createThermostatState(controlPrefix, capabilities.configObj);
			}
		}
		//#endregion

		this.adapter.log.debug(`Created and saved device ${this.id} (${this.name})`);
	}

	async createSwitchStates(statePrefix) {
		if (!this.normalizedDefinition) {
			this.adapter.log.warn(`Device ${this.id}: no normalized definition available`);
			return;
		}

		for (const stateDef of this.normalizedDefinition.deviceType.switchingValues) {
			await this.adapter.setObjectNotExistsAsync(`${statePrefix}${stateDef.name}`, {
				type: "state",
				common: {
					name: stateDef.name,
					type: "boolean",
					role: "button",
					read: false,
					write: true,
					def: false,
				},
				native: {
					commandValue: stateDef.value,
				},
			});
		}
	}

	async createLevelState(statePrefix, levelConfigObj) {
		await this.adapter.setObjectNotExistsAsync(`${statePrefix}${levelConfigObj.kind}`, {
			type: "state",
			common: {
				name: levelConfigObj.kind,
				desc: levelConfigObj.desc,
				type: "number",
				role: levelConfigObj.role,
				read: true,
				write: true,
				min: levelConfigObj.min,
				max: levelConfigObj.max,
				step: levelConfigObj.step,
				unit: levelConfigObj.unit,
				def: 0,
			},
			native: {},
		});
	}

	async createThermostatState(statePrefix, thermostatConfigObj) {
		await this.adapter.setObjectNotExistsAsync(`${statePrefix}${thermostatConfigObj.kind}`, {
			type: "state",
			common: {
				name: thermostatConfigObj.kind,
				desc: thermostatConfigObj.desc,
				type: "number",
				role: thermostatConfigObj.role,
				read: true,
				write: true,
				min: thermostatConfigObj.min,
				max: thermostatConfigObj.max,
				step: thermostatConfigObj.step,
				unit: thermostatConfigObj.unit,
			},
			native: {},
		});
	}

	async createSensorState(statePrefix, sensorConfigObj) {
		await this.adapter.setObjectNotExistsAsync(`${statePrefix}${sensorConfigObj.kind}`, {
			type: "state",
			common: {
				name: sensorConfigObj.kind,
				desc: sensorConfigObj.desc,
				type: "number",
				role: sensorConfigObj.role,
				read: true,
				write: false,
				min: sensorConfigObj.min,
				max: sensorConfigObj.max,
				unit: sensorConfigObj.unit,
				def: 0,
			},
			native: {},
		});
	}

	async createEnumState(statePrefix, enumConfigObj) {
		await this.adapter.setObjectNotExistsAsync(`${statePrefix}${enumConfigObj.kind}`, {
			type: "state",
			common: {
				name: enumConfigObj.kind,
				desc: enumConfigObj.desc,
				type: enumConfigObj.type,
				role: enumConfigObj.role,
				read: true,
				write: false,
				states: enumConfigObj.states,
			},
			native: {},
		});
	}

	// Only writes changed data into the DB
	async Update() {
		//#region  INFO
		const infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;

		await this.adapter.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, this.name, true);
		await this.adapter.setStateChangedAsync(
			infoPrefix + commonDefines.AdapterStateIDs.Designation,
			this.designation,
			true,
		);
		await this.adapter.setStateChangedAsync(
			infoPrefix + commonDefines.AdapterStateIDs.TypeClient,
			this.deviceType,
			true,
		);
		//#endregion

		this.adapter.log.debug(`Updated device data for device ${this.id} (${this.name})`);
	}

	async updateValue(value) {
		// value: Instance of DeviceValue
		if (value.deviceID !== this.id) {
			// This instance does not concern this device
			return;
		}

		let controlPrefix = "";
		let infoPrefix = "";
		if (value.masterDeviceID != this.id) {
			// Child devive under a master device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${value.masterDeviceID}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
			infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${value.masterDeviceID}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;
		} else {
			// Standalone device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
			infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;
		}

		// Dynamisch aus device.normalizedDefinition
		const capabilities = getDeviceCapabilities(this.normalizedDefinition);

		if (capabilities.hasSwitchingValues) {
			// Ignore SwitchingValues as they don't report their state changes
			this.adapter.log.debug(`Device ${this.id}: switchingValue update ignored (value=${value.value})`);
			return;
		}

		if (capabilities.hasLevel || capabilities.hasThermostat) {
			await this.setDeviceStateValue(controlPrefix, capabilities.configObj, value);
		}

		if (capabilities.hasSensor || capabilities.hasEnumState) {
			await this.setDeviceStateValue(infoPrefix, capabilities.configObj, value);
		}
	}

	async setDeviceStateValue(statePrefix, configObj, value) {
		const stateId = `${statePrefix}${configObj.kind}`;
		await this.adapter.setStateAsync(stateId, value.value, true);
		this.adapter.log.debug(`Device ${this.id}: Updated ${configObj.kind} = ${value.value}`);
	}
}

module.exports = SchellenbergDevice;
