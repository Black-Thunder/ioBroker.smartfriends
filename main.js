"use strict";

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require("@iobroker/adapter-core");
const schellenbergBridge = require("./lib/SchellenbergBridge");

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

		if (this.config.smartFriendsPort == null || this.config.smartFriendsPort == "") {
			this.log.warn("Port was not set. Now set to 4900 (default port).");
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

	async connectToGateway() {
		gthis.log.info("Connecting to SmartFriendsBox and retrieving data...");

		SchellenbergBridge = new schellenbergBridge.SchellenbergBridge(gthis);
		SchellenbergBridge.Connect();
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		this.checkSettings()
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

	async setAdapterConnectionState(isConnected) {
		await this.setStateChangedAsync("info.connection", isConnected, true);
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