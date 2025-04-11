"use strict";

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require("@iobroker/adapter-core");
const schellenbergBridge = require("./lib/SchellenbergBridge");
const commonDefines = require("./lib/helpers/CommonDefines");
const DeviceManager = require("./lib/DeviceManager");

let gthis = null; // global to 'this' of smartfriends main instance
let SchellenbergBridge = null;

// Default gateway parameters
const defaultPort = 4900;
const defaultShcVersion = "3.7.0";
const defaultShcApiVersion = "3.4";
const defaultCSymbol = "D19033i";

class ConfigValidator {
	static validate(config) {
		// Add input type validation
		const validations = {
			smartFriendsIP: (ip) => typeof ip === "string" && ip.length > 0,
			smartFriendsPort: (port) => typeof port === "number" && port > 0,
			smartFriendsUsername: (user) => typeof user === "string" && user.length > 0,
			smartFriendsPassword: (pwd) => typeof pwd === "string" && pwd.length > 0
		};

		const errors = Object.entries(validations)
			.filter(([key, validator]) => !validator(config[key]))
			.map(([key]) => `Invalid ${key}`);

		if (errors.length) {
			throw new Error(errors.join(", "));
		}

		const defaults = {
			port: defaultPort,
			cSymbol: defaultCSymbol,
			shcVersion: defaultShcVersion,
			shApiVersion: defaultShcApiVersion
		};

		// Set defaults
		config.smartFriendsPort = config.smartFriendsPort || defaults.port;
		config.smartFriendsCSymbol = config.smartFriendsCSymbol || defaults.cSymbol;
		config.smartFriendsShcVersion = config.smartFriendsShcVersion || defaults.shcVersion;
		config.smartFriendsShApiVersion = config.smartFriendsShApiVersion || defaults.shApiVersion;
	}
}

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

	async checkSettings() {
		this.log.debug("Checking adapter settings...");
		ConfigValidator.validate(this.config);
	}

	async initObjects() {
		this.log.debug("Initializing objects...");

		try {
			// Initialize DeviceManager here when adapter is ready
			this.deviceManager = new DeviceManager(this);

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
		} catch (error) {
			this.log.error(`Failed to initialize objects: ${error.message}`);
			throw error;
		}
	}

	async connectToGateway() {
		gthis.log.info("Connecting to gateway and retrieving data...");
		gthis.log.debug(`IP: ${this.config.smartFriendsIP} - Port: ${this.config.smartFriendsPort} - Username: ${this.config.smartFriendsUsername} - Password: ${this.config.smartFriendsPassword} - CSymbol: ${this.config.smartFriendsCSymbol} - SHCVersion: ${this.config.smartFriendsShcVersion} - SHAPIVersion: ${this.config.smartFriendsShApiVersion}`);

		SchellenbergBridge = new schellenbergBridge.SchellenbergBridge(gthis);
		this.deviceManager.setBridge(SchellenbergBridge);
		SchellenbergBridge.Connect();
	}

	async setAdapterConnectionState(isConnected) {
		await this.setStateChangedAsync(`${commonDefines.AdapterDatapointIDs.Info}.${commonDefines.AdapterStateIDs.Connection}`, isConnected, true);
		await this.setForeignState(`system.adapter.${this.namespace}.connected`, isConnected, true);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		this.initObjects()
			.then(() => this.checkSettings())
			.then(() => {
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
			if (SchellenbergBridge != null) {
				SchellenbergBridge.handleDisconnect();
			}

			this.setAdapterConnectionState(false);
			this.log.info("onUnload(): Cleaned everything up...");

			callback();
			// eslint-disable-next-line no-unused-vars
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state) {
			this.log.silly(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			await this.deviceManager.handleStateChange(id, state);
		} else {
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