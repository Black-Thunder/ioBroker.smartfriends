const commonDefines = require("../helpers/CommonDefines");

class SchellenbergMasterDevice {
	constructor(adapter, masterId, name, devices) {
		this.adapter = adapter;
		this.id = masterId;
		this.name = name;
		this.childDevices = devices; // Array von SchellenbergDevice
	}

	async createMasterFolder() {
		const masterPrefix = `${commonDefines.AdapterDatapointIDs.Devices}.${this.id.replace(this.adapter.FORBIDDEN_CHARS, "")}`;

		// Umlauts are Unicode-escaped and need to be parsed here
		const rawName = this.name.replace(/\${|}/g, "");
		await this.adapter.setObjectNotExistsAsync(masterPrefix, {
			type: "channel",
			common: { name: JSON.parse(`"${rawName.replace(/\\\\/g, "\\")}"`) },
			native: {},
		});

		// Child Devices anlegen
		for (const child of this.childDevices) {
			await child.CreateAndSave(masterPrefix); // MasterPrefix übergeben
		}
	}
}

exports.SchellenbergMasterDevice = SchellenbergMasterDevice;
