"use strict";

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
		const devicePrefix = masterPrefix
			? `${masterPrefix}.${this.id}`
			: `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}`;

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
		//#endregion

		//#region CONTROL
		let controlPrefix = `${devicePrefix}.${commonDefines.AdapterDatapointIDs.Control}`;

		await this.adapter.setObjectNotExistsAsync(controlPrefix, {
			type: "channel",
			common: {
				name: "Device control",
			},
			native: {},
		});

		controlPrefix += ".";

		// Dynamisch aus device.definition
		if (this.definition?.deviceType?.switchingValues) {
			for (const stateDef of this.definition.deviceType.switchingValues) {
				const stateId = stateDef.name.replace(/\${|}/g, ""); // ${On} → On
				await this.adapter.setObjectNotExistsAsync(`${controlPrefix}${stateId}`, {
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
		} else if (this.definition.deviceType.kind === commonDefines.AdapterStateIDs.Position) {
			await this.adapter.setObjectNotExistsAsync(`${controlPrefix}${commonDefines.AdapterStateIDs.Position}`, {
				type: "state",
				common: {
					name: commonDefines.AdapterStateIDs.Position,
					type: "number",
					role: "level.blind",
					read: true,
					write: true,
					min: this.definition.deviceType.min ?? 0,
					max: this.definition.deviceType.max ?? 100,
					step: this.definition.deviceType.step ?? 1,
					unit: "%",
					def: 0,
				},
				native: {},
			});
		}
		//#endregion

		this.adapter.log.debug(`Created and saved device ${this.id} (${this.name})`);
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
		if (value.masterDeviceID != this.id) {
			// Child-Device unter einem Master-Device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${value.masterDeviceID}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
		} else {
			// Einzelnes Device
			controlPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Control}.`;
		}

		if (this.definition?.deviceType?.switchingValues) {
			// SwitchingValues ignorieren, liefern keine Updates zurück
		} else if (this.definition?.deviceType?.kind === commonDefines.AdapterStateIDs.Position) {
			// Für Position → direkt setzen
			const stateId = `${controlPrefix}${commonDefines.AdapterStateIDs.Position}`;
			await this.adapter.setStateAsync(stateId, value.value, true);
			this.adapter.log.debug(`Device ${this.id}: Updated position = ${value.value}`);
		}
	}
}

exports.SchellenbergDevice = SchellenbergDevice;
