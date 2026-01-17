const commonDefines = require("../helpers/CommonDefines");
const { decodeUnicodeString } = require("../helpers/DeviceDefinitions");

class SchellenbergMasterDevice {
	constructor(adapter, masterId, name, devices) {
		this.adapter = adapter;
		this.id = masterId;
		this.name = name;
		this.childDevices = devices; // Array of SchellenbergDevice
	}

	async createMasterFolder() {
		const masterPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id.replace(this.adapter.FORBIDDEN_CHARS, "")}`;

		// Umlauts are Unicode-escaped and need to be parsed here
		await this.adapter.setObjectNotExistsAsync(masterPrefix, {
			type: "channel",
			common: { name: decodeUnicodeString(this.name) },
			native: {},
		});

		// Create child devices
		for (const child of this.childDevices) {
			await child.CreateAndSave(masterPrefix);
		}
	}
}

exports.SchellenbergMasterDevice = SchellenbergMasterDevice;
