const commonDefines = require("../helpers/CommonDefines");

class SchellenbergMasterDevice {
	constructor(adapter, masterId, name, devices) {
		this.adapter = adapter;
		this.id = masterId;
		this.name = name;
		this.childDevices = devices; // Array von SchellenbergDevice
	}

	async createMasterFolder() {
		const masterPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id}`;
		await this.adapter.setObjectNotExistsAsync(masterPrefix, {
			type: "channel",
			common: { name: this.name },
			native: {},
		});

		// Child Devices anlegen
		for (const child of this.childDevices) {
			await child.CreateAndSave(masterPrefix); // MasterPrefix übergeben
		}
	}
}

exports.SchellenbergMasterDevice = SchellenbergMasterDevice;
