"use strict";

/*
 * Created with @iobroker/create-adapter v1.30.1
 */

// The adapter-core module gives you access to the core ioBroker functions you need to create an adapter
const utils = require("@iobroker/adapter-core");
const schellenbergBridge = require("./lib/SchellenbergBridge");
const commonDefines = require("./lib/helpers/CommonDefines");
const DeviceManager = require("./lib/devices/DeviceManager");

let SchellenbergBridge = null;

// Default gateway parameters
const defaultPort = 4900;
const defaultShcVersion = "3.7.4";
const defaultShcApiVersion = "3.4";
const defaultCSymbol = "D19033i";

class ConfigValidator {
	static validate(config) {
		// Regex definitions matching the frontend
		const regex = {
			ip: /^(\d{1,3}\.){3}\d{1,3}$/,
			cSymbol: /^[a-zA-Z]\d{5}[a-zA-Z]$/,
			version: /^\d+(\.\d+){1,3}$/,
		};

		// Add input type validation
		const validations = {
			smartFriendsIP: function (ip) {
				return typeof ip === "string" && regex.ip.test(ip.trim());
			},
			smartFriendsPort: function (port) {
				return typeof port === "number" && port > 0 && port < 65536;
			},
			smartFriendsCSymbol: function (cs) {
				return typeof cs === "string" && regex.cSymbol.test(cs.trim());
			},
			smartFriendsShcVersion: function (v) {
				return typeof v === "string" && regex.version.test(v.trim());
			},
			smartFriendsShApiVersion: function (v) {
				return typeof v === "string" && regex.version.test(v.trim());
			},
		};

		const errors = Object.entries(validations)
			.filter(([key, validator]) => !validator(config[key]))
			.map(([key]) => `Invalid ${key}`);

		if (errors.length) {
			throw new Error(errors.join(", "));
		}

		// Set defaults
		config.smartFriendsPort = config.smartFriendsPort || defaultPort;
		config.smartFriendsCSymbol = config.smartFriendsCSymbol || defaultCSymbol;
		config.smartFriendsShcVersion = config.smartFriendsShcVersion || defaultShcVersion;
		config.smartFriendsShApiVersion = config.smartFriendsShApiVersion || defaultShcApiVersion;
	}
}

class Smartfriends extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options]
	 */
	constructor(options) {
		super({
			...options,
			name: "smartfriends",
		});

		this.credentialUnsubscribe = null;

		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	async checkSettings() {
		this.log.debug("Checking adapter settings...");

		if (this.config.ignoreSslErrors) {
			this.log.warn("SSL errors are ignored when communicating with the gateway. This is potentially insecure!");
		}

		ConfigValidator.validate(this.config);
	}

	/**
	 * Resolves the SmartFriends login credentials.
	 *
	 * Credentials from the central credential store are preferred.
	 * Legacy adapter configuration is used as fallback.
	 *
	 * @returns {Promise<{login: string, password: string, managed: boolean}>}
	 */
	async resolveCredentials() {
		const credentialId = this.config.smartFriendsCredentialId;

		if (typeof credentialId === "string" && credentialId) {
			if (!utils.Credentials?.getCredentials) {
				throw new Error(
					"The credentials manager is not available. Please update js-controller to 7.2.2 or higher.",
				);
			}

			const credential = await utils.Credentials.getCredentials(this, credentialId);

			if (utils.Credentials.getCredentialForm(credential.values) !== "login") {
				throw new Error(`Credential "${credentialId}" must contain login and password.`);
			}

			const login = credential.values.login;
			const password = credential.values.password;

			if (typeof login !== "string" || !login.trim() || typeof password !== "string" || !password) {
				throw new Error(`Credential "${credentialId}" is incomplete.`);
			}

			return {
				login,
				password,
				managed: true,
			};
		}

		const login = this.config.smartFriendsUsername;
		const password = this.config.smartFriendsPassword;

		if (typeof login !== "string" || !login.trim()) {
			throw new Error("SmartFriends username empty! Check settings.");
		}

		if (typeof password !== "string" || !password) {
			throw new Error("SmartFriends password empty! Check settings.");
		}

		return {
			login,
			password,
			managed: false,
		};
	}

	async subscribeToCredentialChanges() {
		const credentialId = this.config.smartFriendsCredentialId;

		if (typeof credentialId !== "string" || !credentialId) {
			return;
		}

		this.log.debug(`Subscribing to credential changes: ${credentialId}`);

		this.credentialUnsubscribe = await utils.Credentials.subscribeCredentials(
			this,
			credentialId,
			async (id, credential) => {
				if (!credential) {
					this.log.warn(`Credential "${id}" was deleted. Connection to the gateway will be stopped.`);

					if (SchellenbergBridge) {
						SchellenbergBridge.handleDisconnect(true);
						SchellenbergBridge = null;
					}

					await this.setAdapterConnectionState(false);
					return;
				}

				if (utils.Credentials.getCredentialForm(credential.values) !== "login") {
					this.log.error(`Credential "${id}" must contain login and password.`);
					return;
				}

				const login = credential.values.login;
				const password = credential.values.password;

				if (typeof login !== "string" || !login.trim() || typeof password !== "string" || !password) {
					this.log.error(`Credential "${id}" is incomplete.`);
					return;
				}

				this.log.info(`Credential "${id}" changed. Reconnecting to gateway...`);

				if (SchellenbergBridge) {
					SchellenbergBridge.handleDisconnect(true);
					SchellenbergBridge = null;
				}

				await this.connectToGateway({
					login,
					password,
					managed: true,
				});
			},
		);

		this.log.debug(`Subscribed to credential changes: ${credentialId}`);
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
					name: "Adapter information",
				},
				native: {},
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
					desc: "Indicates if connection to SmartFriendsBox was successful or not",
				},
				native: {},
			});

			// gateway
			let gatewayPrefix = commonDefines.AdapterDatapointIDs.Gateway;
			await this.setObjectNotExistsAsync(gatewayPrefix, {
				type: "channel",
				common: {
					name: "Gateway information",
				},
				native: {},
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
					desc: "Actual Hardware name",
				},
				native: {},
			});

			await this.setObjectNotExistsAsync(gatewayPrefix + commonDefines.AdapterStateIDs.MacAddress, {
				type: "state",
				common: {
					name: "Hardware MAC address",
					type: "string",
					role: "info.mac",
					read: true,
					write: false,
					desc: "Hardware MAC address",
				},
				native: {},
			});

			// devices
			await this.setObjectNotExistsAsync(commonDefines.AdapterDatapointIDs.Devices, {
				type: "folder",
				common: {
					name: "Devices",
				},
				native: {},
			});

			this.setAdapterConnectionState(false);
		} catch (error) {
			this.log.error(`Failed to initialize objects: ${error.message}`);
			throw error;
		}
	}

	async connectToGateway(credentials) {
		this.log.info("Connecting to gateway and retrieving data...");
		this.log.debug(
			`IP: ${this.config.smartFriendsIP} - Port: ${this.config.smartFriendsPort} - CSymbol: ${this.config.smartFriendsCSymbol} - SHCVersion: ${this.config.smartFriendsShcVersion} - SHAPIVersion: ${this.config.smartFriendsShApiVersion}`,
		);

		SchellenbergBridge = new schellenbergBridge.SchellenbergBridge(this, credentials);

		if (this.deviceManager != null) {
			this.deviceManager.setBridge(SchellenbergBridge);
		}

		await SchellenbergBridge.Connect();
	}

	async setAdapterConnectionState(isConnected) {
		await this.setStateChangedAsync(
			`${commonDefines.AdapterDatapointIDs.Info}.${commonDefines.AdapterStateIDs.Connection}`,
			isConnected,
			true,
		);
		await this.setForeignState(`system.adapter.${this.namespace}.connected`, isConnected, true);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		try {
			await this.initObjects();
			await this.checkSettings();

			const credentials = await this.resolveCredentials();

			this.log.debug(`Managed credentials: ${credentials.managed}`);

			if (credentials.managed) {
				this.log.debug(`Credential ID: ${this.config.smartFriendsCredentialId}`);
			}

			await this.connectToGateway(credentials);

			this.subscribeStates("devices.*.control.*");

			if (credentials.managed) {
				await this.subscribeToCredentialChanges();
			}
		} catch (error) {
			this.log.error(error instanceof Error ? error.message : String(error));
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	async onUnload(callback) {
		try {
			if (this.credentialUnsubscribe) {
				await this.credentialUnsubscribe();
				this.credentialUnsubscribe = null;
			}

			if (SchellenbergBridge) {
				SchellenbergBridge.handleDisconnect(true);
				SchellenbergBridge = null;
			}

			await this.setAdapterConnectionState(false);

			this.log.info("onUnload(): Cleaned everything up...");
		} catch (error) {
			this.log.error(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
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
			if (this.deviceManager != null) {
				await this.deviceManager.handleStateChange(id, state);
			}
		} else {
			this.log.silly(`state ${id} deleted`);
		}
	}
}

// @ts-expect-error parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options]
	 */
	module.exports = options => new Smartfriends(options);
} else {
	// otherwise start the instance directly
	new Smartfriends();
}
