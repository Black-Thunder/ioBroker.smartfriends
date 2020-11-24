"use strict";

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require("@iobroker/adapter-core");
const schellenbergBridge = require("./lib/SchellenbergBridge");
const commonDefines = require("./lib/helpers/CommonDefines");

let gthis = null; // global to 'this' of Melcloud main instance
let SchellenbergBridge = null;

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
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
		gthis = this;
	}

	async checkSettings() {
		this.log.debug("Checking adapter settings...");

		//this.decryptPassword();

		if (this.config.smartFriendsPort == null || this.config.smartFriendsPort <= 0) {
			this.log.warn("Port was not correctly set. Now set to 4900 (default port).");
			this.config.smartFriendsPort = 4900;
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

				//this.subscribeStates("testVariable");
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

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
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