"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//TLS Socket Wrapper to handle all types of
//events occurring and passing on received data
//--------------------------------------------------

const Deffered = require("../helpers/Deffered.js");
const tls = require("tls");
const CommandFactory = require("./CommandFactory.js");

class SmartSocket {
	constructor(adapter, ipAddress, port, certText) {
		this.adapter = adapter;
		this.ipAddress = ipAddress;
		this.certText = certText;
		this.port = port;
		this.tempByteChunk = "";
	}
	setDelegate(dataDelegate) {
		this.dataDelegate = dataDelegate;
	}
	setupSocket(dataDelegate) {
		this.adapter.log.debug("Setting up socket...");
		const socketOptions = {
			timeout: 10000,
			secureProtocol: "TLSv1_2_method",
			host: this.ipAddress,
			port: this.port,
			ca: this.certText,
			rejectUnauthorized: true,
			checkServerIdentity: (host, cert) => {
				this.adapter.log.debug(`Cert issuer organization: ${cert.issuer.O}`);
				return undefined;
			},
		};
		/**
		 * @returns {Promise<SmartSocket>}
		 */
		return new Promise((resolve, reject) => {
			if (dataDelegate) {
				this.dataDelegate = dataDelegate;
			}
			this.internalSocket = tls
				.connect(socketOptions, () => {
					if (this.internalSocket) {
						this.internalSocket.on("error", err => {
							this.adapter.log.error(`Setup connection error: ${err.toString()}`);
							setImmediate(() => {
								if (this.dataDelegate) {
									this.dataDelegate.handleDisconnect();
								}
							});
						});
						if (!this.internalSocket.authorized) {
							this.adapter.log.error(
								`Setup connection not authorized with error: ${this.internalSocket.authorizationError}`,
							);
							reject(this.internalSocket.authorizationError.toString());
						} else {
							this.internalSocket.setEncoding("utf8");
							this.setupSocketEvents();
							this.adapter.log.debug("Setup socket successfully");
							resolve(this);
						}
					}
				})
				.on("error", err => {
					this.adapter.log.error(`Error occured: ${err.toString()}`);
					reject(err.toString());
				});
		});
	}
	setupSocketEvents() {
		this.adapter.log.debug("Setting up socket events...");
		if (this.internalSocket) {
			this.internalSocket.on("data", data => {
				if (data.indexOf("\n") < 0) {
					this.tempByteChunk += data.toString();
				} else {
					this.tempByteChunk += data.toString();
					const tempSplit = this.tempByteChunk.split("\n");
					for (const tempSplitString of tempSplit) {
						if (tempSplitString !== "") {
							this.adapter.log.debug(`Received data: ${tempSplitString}`);
							if (this.dataDelegate) {
								this.dataDelegate.handleMessage(tempSplitString);
							}
						}
					}
					this.tempByteChunk = "";
				}
			});
			this.internalSocket.on("timeout", () => {
				this.adapter.log.warn("Socket timed out");
				setTimeout(() => {
					if (this.dataDelegate) {
						this.dataDelegate.renewSocket("Timeout");
					}
				}, 1000);
			});
			this.internalSocket.on("end", () => {
				this.adapter.log.warn("Socket ended");
				setImmediate(() => {
					if (this.dataDelegate) {
						this.dataDelegate.handleDisconnect();
					}
				});
			});
			this.internalSocket.on("close", () => {
				this.adapter.log.warn("Socket closed");
				setImmediate(() => {
					if (this.dataDelegate) {
						this.dataDelegate.handleDisconnect();
					}
				});
			});
		}
	}
	startKeepAlive() {
		this.keepAliveHandler = setInterval(() => {
			this.sendJSONCommand(CommandFactory.default.createKeepAliveCmd());
		}, 5000);
	}
	stopKeepAlive() {
		if (this.keepAliveHandler) {
			clearInterval(this.keepAliveHandler);
		}
	}
	//only sending command without waiting for response in the local MessageHandler.
	// Does not resolve when send fails.
	//be advised, that a may occurring response is discarded and may result in an error
	sendJSONCommand(command) {
		this.adapter.log.debug(`Sending command with method: ${command.command}`);
		const localPromise = new Deffered.default((resolve, reject) => {
			if (this.internalSocket && command) {
				this.adapter.log.debug(`Send JSON: ${command.toString()}`);
				this.internalSocket.write(command.toString());
				this.internalSocket.write("\n");
				resolve();
			} else {
				this.adapter.log.error("Error sending command. Check socket or JSONCommand.");
				reject("Something went wrong");
			}
		});
		return localPromise;
	}
	//sends command and waits for receive in the promise queue of the message handler
	//don't know if the output socket of the gateway is in-order, so maybe there needs
	//to be some checking
	sendAndRecieveCommand(command, sessionkey) {
		const localPromise = new Deffered.default((resolve, reject) => {
			if (this.internalSocket && command) {
				this.adapter.log.debug(`Send and receive JSON: ${command.toString(sessionkey)}`);
				this.internalSocket.write(command.toString(sessionkey));
				this.internalSocket.write("\n");
			} else {
				reject();
			}
		});
		if (this.dataDelegate) {
			this.dataDelegate.queueUpPromise(localPromise);
		}
		return localPromise;
	}
}
exports.SmartSocket = SmartSocket;
