"use strict";

const commonDefines = require("./helpers/CommonDefines");

let gthat = null; // pointer to "this" from main.js instance

class SchellenbergDevice {
	constructor(that) {
		gthat = that;
		this.platform = null;

		// Info
		this.id = -1;
		this.name = "";
		this.deviceType = "";
		this.designation = "";

		// Control
		this.power = false;
	}

	// Creates all necessery states and channels and writes the values into the DB
	async CreateAndSave() {
		const devicePrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}`;
		await gthat.setObjectNotExistsAsync(devicePrefix, {
			type: "channel",
			common: {
				name: `Device ${this.id} (${this.name})`,
			},
			native: {},
		});

		//#region INFO
		let infoPrefix = `${devicePrefix}.${commonDefines.AdapterDatapointIDs.Info}`;
		await gthat.setObjectNotExistsAsync(infoPrefix, {
			type: "channel",
			common: {
				name: "Device information",
			},
			native: {},
		});

		infoPrefix += ".";

		await gthat.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, {
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

		await gthat.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.Designation, {
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

		await gthat.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, {
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
		await gthat.setObjectNotExistsAsync(controlPrefix, {
			type: "channel",
			common: {
				name: "Device control",
			},
			native: {},
		});

		controlPrefix += ".";

		switch (this.deviceType) {
			case commonDefines.KnownDeviceTypes.AwningEngine.type:
				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveDown, {
					type: "state",
					common: {
						name: "Move downwards",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						def: false,
						desc: "Move downwards, lower sunblind",
					},
					native: {},
				});

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveUp, {
					type: "state",
					common: {
						name: "Move upwards",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						def: false,
						desc: "Move upwards, retract sunblind",
					},
					native: {},
				});

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveStop, {
					type: "state",
					common: {
						name: "Stop movement",
						type: "boolean",
						role: "button.stop",
						read: false,
						write: true,
						def: false,
						desc: "Stop movement, leave sunblind at current position",
					},
					native: {},
				});
				break;
			case commonDefines.KnownDeviceTypes.RollingShutter.type:
				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.Close, {
					type: "state",
					common: {
						name: "Close shutter",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						def: false,
						desc: "Close shutter",
					},
					native: {},
				});

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.Open, {
					type: "state",
					common: {
						name: "Open shutter",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						def: false,
						desc: "Open shutter",
					},
					native: {},
				});

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveStop, {
					type: "state",
					common: {
						name: "Stop movement",
						type: "boolean",
						role: "button.stop",
						read: false,
						write: true,
						def: false,
						desc: "Stop shutter movement",
					},
					native: {},
				});
				break;
			default:
				gthat.log.error(
					`No controls known for device type '${this.deviceType}' - Report this to the developer!`,
				);
				break;
		}
		//#endregion

		gthat.log.debug(`Created and saved device ${this.id} (${this.name})`);
	}

	// Only writes changed data into the DB
	async Update() {
		//#region  INFO
		const infoPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}.${commonDefines.AdapterDatapointIDs.Info}.`;

		await gthat.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, this.name, true);
		await gthat.setStateChangedAsync(
			infoPrefix + commonDefines.AdapterStateIDs.Designation,
			this.designation,
			true,
		);
		await gthat.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, this.deviceType, true);
		//#endregion

		gthat.log.debug(`Updated device data for device ${this.id} (${this.name})`);
	}
}

exports.SchellenbergDevice = SchellenbergDevice;
