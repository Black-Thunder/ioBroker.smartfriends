const { SchellenbergDevice } = require("./SchellenbergDevice");
const commonDefines = require("./helpers/CommonDefines");
const commandFactory = require("./comunication/CommandFactory");

class DeviceManager {
	constructor(adapter) {
		this.adapter = adapter;
		this.devices = new Map();
		this.log = adapter.log;
		this.bridge = null;

		// Bind all methods that use 'this' context
		this.handleStateChange = this.handleStateChange.bind(this);
		this.sendDeviceCommand = this.sendDeviceCommand.bind(this);
		this.mapControlCommand = this.mapControlCommand.bind(this);
		this.createDevice = this.createDevice.bind(this);
		this.updateDevice = this.updateDevice.bind(this);
		this.deleteDevice = this.deleteDevice.bind(this);
	}

	setBridge(bridge) {
		this.bridge = bridge;
	}

	async createDevice(deviceInfo) {
		try {
			const device = new SchellenbergDevice(this.adapter);
			Object.assign(device, deviceInfo);
			await device.CreateAndSave();
			this.devices.set(deviceInfo.id, device);
			this.log.debug(`Device created: ${deviceInfo.id}`);
			return device;
		} catch (error) {
			this.log.error(`Failed to create device: ${error.message}`);
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
			if (!state || state.ack || state.val === false) {
				return;
			}

			let deviceId = id.replace(`${this.adapter.namespace}.${commonDefines.AdapterDatapointIDs.Devices}.`, "");
			deviceId = deviceId.substring(0, deviceId.indexOf("."));

			const controlOption = id.substring(id.lastIndexOf(".") + 1, id.length);
			const controlCommand = this.mapControlCommand(controlOption);

			if (deviceId && controlCommand !== commonDefines.DeviceCommands.UNDEF) {
				await this.sendDeviceCommand(deviceId, controlCommand, id);
			}
		} catch (error) {
			this.log.error(`Error in handleStateChange: ${error.message}`);
		}
	}

	mapControlCommand(controlOption) {
		const commandMap = {
			[commonDefines.AdapterStateIDs.MoveDown]: commonDefines.DeviceCommands.MoveDown,
			[commonDefines.AdapterStateIDs.Close]: commonDefines.DeviceCommands.Close,
			[commonDefines.AdapterStateIDs.MoveUp]: commonDefines.DeviceCommands.MoveUp,
			[commonDefines.AdapterStateIDs.Open]: commonDefines.DeviceCommands.Open,
			[commonDefines.AdapterStateIDs.MoveStop]: commonDefines.DeviceCommands.MoveStop
		};

		const command = commandMap[controlOption];
		if (!command) {
			this.log.error(`Unsupported control option: ${controlOption} - Please report this to the developer!`);
			return commonDefines.DeviceCommands.UNDEF;
		}
		return command;
	}

	async sendDeviceCommand(deviceId, controlCommand, stateId) {
		try {
			if (!this.bridge) {
				throw new Error("Bridge not initialized");
			}

			this.log.debug(`Sending command '${controlCommand.name}' to device ${deviceId}...`);
			await this.bridge.sendAndReceiveCommand(
				commandFactory.default.createSetDeviceValueCmd(deviceId, controlCommand.value)
			);
			await this.adapter.setState(stateId, false, true);
		} catch (error) {
			this.log.error(`Error in sendDeviceCommand: ${error.message}`);
			throw error;
		}
	}
}

module.exports = DeviceManager;