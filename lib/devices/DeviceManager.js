const SchellenbergDevice = require("./SchellenbergDevice");
const commonDefines = require("../helpers/CommonDefines");
const commandFactory = require("../comunication/CommandFactory");

class DeviceManager {
	constructor(adapter) {
		this.adapter = adapter;
		this.devices = new Map();
		this.log = adapter.log;
		this.bridge = null;
	}

	setBridge(bridge) {
		this.bridge = bridge;
	}

	async createDevice(deviceInfo) {
		try {
			const device = new SchellenbergDevice(this.adapter);
			Object.assign(device, deviceInfo);
			await device.CreateAndSave(deviceInfo.masterPrefix);
			this.devices.set(deviceInfo.id, device);
			return device;
		} catch (error) {
			this.log.error(`Failed to create device ${deviceInfo.id}: ${error.message}`);
			throw error;
		}
	}

	getDevice(id) {
		return this.devices.get(id);
	}

	getAllDevices() {
		return Array.from(this.devices.values());
	}

	async updateDevice(id, data) {
		const device = this.getDevice(id);
		if (device) {
			Object.assign(device, data);
			await device.Update();
			this.log.debug(`Device updated: ${id}`);
		} else {
			this.log.warn(`Device not found for update: ${id}`);
		}
	}

	async deleteDevice(id) {
		const device = this.getDevice(id);
		if (device) {
			await device.Delete();
			this.devices.delete(id);
			this.log.debug(`Device deleted: ${id}`);
		}
	}

	async handleStateChange(id, state) {
		try {
			if (!state || state.ack) {
				return;
			}

			const devicePrefix = `${this.adapter.namespace}.${commonDefines.AdapterDatapointIDs.Devices}.`;
			const path = id.replace(devicePrefix, "");
			const parts = path.split(".");

			let childId;
			if (parts.length === 1) {
				// nur ein Device, kein Master
				childId = parts[0];
			} else if (parts.length >= 2) {
				// Master + Child
				childId = parts[1];
			} else {
				this.adapter.log.warn(`Invalid state path: ${id}`);
				return;
			}

			const obj = await this.adapter.getObjectAsync(id);

			const commandValue = typeof state.val === "number" ? state.val : obj?.native?.commandValue;

			if (commandValue == null) {
				this.adapter.log.warn(`No commandValue defined for ${id}`);
				return;
			}

			this.adapter.log.debug(`Control triggered: device=${childId}, command=${commandValue} (state=${id})`);

			await this.sendDeviceCommand(childId, commandValue);

			await this.adapter.setStateAsync(id, false, true);
		} catch (error) {
			this.log.error(`Error in handleStateChange: ${error.responseMessage}`);
		}
	}

	async sendDeviceCommand(deviceId, value) {
		try {
			if (!this.bridge) {
				throw new Error("Bridge not initialized");
			}

			this.log.debug(`Sending value '${value}' to device ${deviceId}...`);

			await this.bridge.sendAndReceiveCommand(commandFactory.default.createSetDeviceValueCmd(deviceId, value));
		} catch (error) {
			this.log.error(`Error in sendDeviceCommand: ${error.responseMessage}`);
			throw error;
		}
	}

	updateDeviceValue(deviceValue) {
		const device = this.devices?.get(deviceValue.deviceID);
		if (!device) {
			this.adapter.log.debug(`Received value for unknown device ${deviceValue.deviceID}, ignoring.`);
			return;
		}

		device.updateValue(deviceValue);
	}
}

module.exports = DeviceManager;
