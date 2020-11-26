"use strict";

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require("@iobroker/adapter-core");
const schellenbergBridge = require("./lib/SchellenbergBridge");
const commonDefines = require("./lib/helpers/CommonDefines");
const commandFactory = require("./lib/comunication/CommandFactory");

let gthis = null; // global to 'this' of Melcloud main instance
let SchellenbergBridge = null;

// Default gateway parameters
const defaultPort = 4900;
const defaultShcVersion = "2.21.1";
const defaultShcApiVersion = "2.15";
const defaultCSymbol = "D19033i";

class Smartfriends extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "smartfriends",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
		gthis = this;
	}

	async decryptPassword() {
		const sysConfigObject = (await this.getForeignObjectAsync("system.config"));
		if (!this.supportsFeature || !this.supportsFeature("ADAPTER_AUTO_DECRYPT_NATIVE")) {
			if (sysConfigObject && sysConfigObject.native && sysConfigObject.native.secret) {
				this.config.smartFriendsPassword = commonDefines.decrypt(sysConfigObject.native.secret, this.config.smartFriendsPassword);
			} else {
				this.config.smartFriendsPassword = commonDefines.decrypt("Zgfr56gFe87jJOM", this.config.smartFriendsPassword);
			}
		}
	}

	async checkSettings() {
		this.log.debug("Checking adapter settings...");

		this.decryptPassword();

		if (this.config.smartFriendsPort == null || this.config.smartFriendsPort <= 0) {
			this.log.warn("Port was not correctly set. Defaulting to '"+ defaultPort +  "'.");
			this.config.smartFriendsPort = defaultPort;
		}

		if (this.config.smartFriendsIP == null || this.config.smartFriendsIP == "") {
			throw new Error("IP address empty! Check settings.");
		}

		if (this.config.smartFriendsUsername == null || this.config.smartFriendsUsername == "") {
			throw new Error("Username empty! Check settings.");
		}

		if (this.config.smartFriendsPassword == null || this.config.smartFriendsPassword == "") {
			throw new Error("Password empty! Check settings.");
		}

		if (this.config.smartFriendsCSymbol == null || this.config.smartFriendsCSymbol == "") {
			this.log.warn("CSymbol was not correctly set. Defaulting to '" + defaultCSymbol + ".");
			this.config.smartFriendsCSymbol = defaultCSymbol;
		}

		if (this.config.smartFriendsShcVersion == null || this.config.smartFriendsShcVersion == "") {
			this.log.warn("SHCVersion was not correctly set. Defaulting to '"+ defaultShcVersion + "'.");
			this.config.smartFriendsShcVersion = defaultShcVersion;
		}

		if (this.config.smartFriendsShApiVersion == null || this.config.smartFriendsShApiVersion == "") {
			this.log.warn("SHAPIVersion was not correctly set. Defaulting to '" + defaultShcApiVersion + "'.");
			this.config.smartFriendsShApiVersion = defaultShcApiVersion;
		}
	}

	async initObjects() {
		this.log.debug("Initializing objects...");

		// info
		let infoPrefix = commonDefines.AdapterDatapointIDs.Info;
		await this.setObjectNotExistsAsync(infoPrefix, {
			type: "channel",
			common: {
				name: "Adapter information"
			},
			native: {}
		});

		infoPrefix += ".";

		await this.setObjectNotExistsAsync(infoPrefix + commonDefines.AdapterStateIDs.Connection, {
			type: "state",
			common: {
				name: "Connection to gateway",
				type: "boolean",
				role: "indicator.connected",
				read: true,
				write: false,
				desc: "Indicates if connection to SmartFriendsBox was successful or not"
			},
			native: {}
		});

		// gateway
		let gatewayPrefix = commonDefines.AdapterDatapointIDs.Gateway;
		await this.setObjectNotExistsAsync(gatewayPrefix, {
			type: "channel",
			common: {
				name: "Gateway information"
			},
			native: {}
		});

		gatewayPrefix += ".";

		await this.setObjectNotExistsAsync(gatewayPrefix + commonDefines.AdapterStateIDs.HardwareName, {
			type: "state",
			common: {
				name: "Hardware name",
				type: "string",
				role: "text",
				read: true,
				write: false,
				desc: "Actual Hardware name"
			},
			native: {}
		});

		await this.setObjectNotExistsAsync(gatewayPrefix + commonDefines.AdapterStateIDs.MacAddress, {
			type: "state",
			common: {
				name: "Hardware MAC address",
				type: "string",
				role: "info.mac",
				read: true,
				write: false,
				desc: "Hardware MAC address"
			},
			native: {}
		});

		this.setAdapterConnectionState(false);
	}

	async connectToGateway() {
		gthis.log.info("Connecting to gateway and retrieving data...");
		gthis.log.debug("IP: " + this.config.smartFriendsIP + " - Port: " + this.config.smartFriendsPort + " - Username: " + this.config.smartFriendsUsername + " - Password: " +
						this.config.smartFriendsPassword + " - CSymbol: " +	this.config.smartFriendsCSymbol + " - SHCVersion: " + this.config.smartFriendsShcVersion +
						" - SHAPIVersion: " + this.config.smartFriendsShApiVersion);

		SchellenbergBridge = new schellenbergBridge.SchellenbergBridge(gthis);
		SchellenbergBridge.Connect();
	}

	async setAdapterConnectionState(isConnected) {
		await this.setStateChangedAsync(commonDefines.AdapterDatapointIDs.Info + "." + commonDefines.AdapterStateIDs.Connection, isConnected, true);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		this.initObjects()
			.then(() => this.checkSettings())
			.then(() =>
			{
				this.connectToGateway();
				this.subscribeStates("devices.*.control.*"); // only subsribe to states changes under "devices.X.control."
			})
			.catch(err => this.log.error(err));
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if(SchellenbergBridge != null) {
				SchellenbergBridge.handleDisconnect();
			}

			this.setAdapterConnectionState(false);
			this.log.info("onUnload(): Cleaned everything up...");

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			if(state.val == false) {
				this.log.silly("Only suscribed to val==true. No need to process changed data.");
				return;
			}

			// ack is true when state was updated by gateway --> in this case, we don't need to send it again
			if (state.ack) {
				this.log.silly("Updated data was retrieved from gateway. No need to process changed data.");
				return;
			}

			// Only states under "devices.XXX.control" are subscribed --> device settings/modes are changed
			let deviceId = id.replace(this.namespace + "." + commonDefines.AdapterDatapointIDs.Devices + ".", "");
			deviceId = deviceId.substring(0, deviceId.indexOf("."));

			const controlOption = id.substring(id.lastIndexOf(".") + 1, id.length);
			let controlCommand = commonDefines.DeviceCommands.UNDEF;
			switch (controlOption) {
				case (commonDefines.AdapterStateIDs.MoveDown):
					controlCommand = commonDefines.DeviceCommands.MoveDown;
					break;
				case (commonDefines.AdapterStateIDs.MoveUp):
					controlCommand = commonDefines.DeviceCommands.MoveUp;
					break;
				case (commonDefines.AdapterStateIDs.MoveStop):
					controlCommand = commonDefines.DeviceCommands.MoveStop;
					break;
				default:
					this.log.error("Unsupported control option: " + controlOption + " - Please report this to the developer!");
					break;
			}

			if(deviceId != "" && controlCommand != commonDefines.DeviceCommands.UNDEF) {
				this.log.info("Sending command '" + controlCommand.name + "' to device " + deviceId + "...");
				SchellenbergBridge.sendAndReceiveCommand(commandFactory.default.createSetDeviceValueCmd(deviceId, controlCommand.value));
				this.setStateAsync(id, false, true);
			}
		} else {
			// The state was deleted
			this.log.silly(`state ${id} deleted`);
		}
	}
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Smartfriends(options);
} else {
	// otherwise start the instance directly
	new Smartfriends();
}