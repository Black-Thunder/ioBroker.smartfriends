"use strict";

const { getDeviceCapabilities } = require("./DeviceKindCapabilities");
const commonDefines = require("../helpers/CommonDefines");

class SchellenbergDevice {
	constructor(adapter) {
		this.adapter = adapter;
		this.definition = null;

		// Info
		this.id = -1;
		this.name = "";
		this.deviceType = "";
		this.designation = "";
	}

	// Creates all necessery states and channels and writes the values into the DB
	async CreateAndSave(masterPrefix) {
		// Dynamisch aus device.definition
		const capabilities = getDeviceCapabilities(this.definition);

		let devicePrefix = masterPrefix
			? `${masterPrefix}.${this.id}`
			: `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}`;

		devicePrefix = devicePrefix.replace(this.adapter.FORBIDDEN_CHARS, "");

		await this.adapter.setObjectNotExistsAsync(devicePrefix, {
			type: "channel",
			common: {
				name: this.name,
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

		if (capabilities.hasAlarm) {
			await this.createAlarmState(infoPrefix, capabilities.configObj);
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
		}
		//#endregion

		this.adapter.log.debug(`Created and saved device ${this.id} (${this.name})`);
	}

	async createSwitchStates(statePrefix) {
		for (const stateDef of this.definition.deviceType.switchingValues) {
			const stateId = stateDef.name
				.replace(/\${|}/g, "") // ${On} → On
				.replace(this.adapter.FORBIDDEN_CHARS, "")
				.toLowerCase();

			await this.adapter.setObjectNotExistsAsync(`${statePrefix}${stateId}`, {
				type: "state",
				common: {
					name: stateId,
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
				step: sensorConfigObj.step,
				unit: sensorConfigObj.unit,
				def: 0,
			},
			native: {},
		});
	}

	async createAlarmState(statePrefix, alarmConfigObj) {
		await this.adapter.setObjectNotExistsAsync(`${statePrefix}${alarmConfigObj.kind}`, {
			type: "state",
			common: {
				name: alarmConfigObj.kind,
				desc: alarmConfigObj.desc,
				type: "number",
				role: alarmConfigObj.role,
				read: true,
				write: false,
				states: alarmConfigObj.states,
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
		// value: Instanz von DeviceValue
		if (value.deviceID !== this.id) {
			// Diese Instanz betrifft nicht dieses Device
			return;
		}

		let controlPrefix = "";
		let infoPrefix = "";
		if (value.masterDeviceID != this.id) {
			// Child-Device unter einem Master-Device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${value.masterDeviceID}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
			infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${value.masterDeviceID}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;
		} else {
			// Einzelnes Device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
			infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;
		}

		// Dynamisch aus device.definition
		const capabilities = getDeviceCapabilities(this.definition);

		if (capabilities.hasSwitchingValues) {
			// SwitchingValues ignorieren, liefern keine Updates zurück
			this.adapter.log.debug(`Device ${this.id}: switchingValue update ignored (value=${value.value})`);
			return;
		}

		if (capabilities.hasLevel) {
			await this.setDeviceStateValue(controlPrefix, capabilities.configObj, value);
		}

		if (capabilities.hasSensor) {
			await this.setDeviceStateValue(infoPrefix, capabilities.configObj, value);
		}

		if (capabilities.hasAlarm) {
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
