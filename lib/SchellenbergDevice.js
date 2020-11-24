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
		this.typeClient = "";
		this.designation = "";

		// Control
		this.power = false;
	}

	// Creates all necessery states and channels and writes the values into the DB
	async CreateAndSave() {
		const devicePrefix = commonDefines.AdapterDatapointIDs.Devices + "." + this.id;
		await gthat.setObjectNotExistsAsync(devicePrefix, {
			type: "channel",
			common: {
				name: "Device " + this.id + " (" + this.name + ")"
			},
			native: {}
		});

		//// INFO
		let infoPrefix = devicePrefix + "." + commonDefines.AdapterDatapointIDs.Info;
		await gthat.setObjectNotExistsAsync(infoPrefix, {
			type: "channel",
			common: {
				name: "Device information"
			},
			native: {}
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
				desc: "Device name"
			},
			native: {}
		});
		await gthat.setStateAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, this.name, true);

		await gthat.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.Designation, {
			type: "state",
			common: {
				name: "Device designation",
				type: "string",
				role: "text",
				read: true,
				write: false,
				desc: "Device designation"
			},
			native: {}
		});
		await gthat.setStateAsync(infoPrefix + commonDefines.AdapterStateIDs.Designation, this.designation, true);

		await gthat.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, {
			type: "state",
			common: {
				name: "Device type client",
				type: "string",
				role: "text",
				read: true,
				write: false,
				desc: "Device type client"
			},
			native: {}
		});
		await gthat.setStateAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, this.typeClient, true);

		//// CONTROL
		let controlPrefix = devicePrefix + "." + commonDefines.AdapterDatapointIDs.Control;
		await gthat.setObjectNotExistsAsync(controlPrefix, {
			type: "channel",
			common: {
				name: "Device control"
			},
			native: {}
		});

		controlPrefix += ".";

		switch(this.typeClient) {
			case commonDefines.KnownDeviceTypes.AwningEngine.type:
				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveDown, {
					type: "state",
					common: {
						name: "Move downwards",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						desc: "Move downwards, lower sunblind"
					},
					native: {}
				});
				await gthat.setStateAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveDown, false, true);

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveUp, {
					type: "state",
					common: {
						name: "Move upwards",
						type: "boolean",
						role: "button.start",
						read: false,
						write: true,
						desc: "Move upwards, retract sunblind"
					},
					native: {}
				});
				await gthat.setStateAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveUp, false, true);

				await gthat.setObjectNotExistsAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveStop, {
					type: "state",
					common: {
						name: "Stop movement",
						type: "boolean",
						role: "button.stop",
						read: false,
						write: true,
						desc: "Stop movement, leave sunblind at current position"
					},
					native: {}
				});
				await gthat.setStateAsync(controlPrefix + commonDefines.AdapterStateIDs.MoveStop, false, true);

				break;
			default:
				gthat.log.warn("No controls known for device type " + this.typeClient + " - Report this to the developer!");
				break;
		}
		//// END CONTROL

		gthat.log.debug("Created and saved device " + this.id + " (" + this.name + ")");
	}

	// Only writes changed data into the DB
	async Update() {
		//// INFO
		const infoPrefix = commonDefines.AdapterDatapointIDs.Devices + "." + this.id + "." + commonDefines.AdapterDatapointIDs.Info + ".";

		await gthat.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.DeviceName, this.name, true);
		await gthat.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.Designation, this.designation, true);
		await gthat.setStateChangedAsync(infoPrefix + commonDefines.AdapterStateIDs.TypeClient, this.typeClient, true);
		//// END INFO

		//// CONTROL
		const controlPrefix = commonDefines.AdapterDatapointIDs.Devices + "." + this.id + "." + commonDefines.AdapterDatapointIDs.Control + ".";
		//// END CONTROL

		gthat.log.debug("Updated device data for device " + this.id + " (" + this.name + ")");
	}
}

exports.SchellenbergDevice = SchellenbergDevice;