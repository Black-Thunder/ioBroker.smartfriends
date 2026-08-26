"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

const fs = require("node:fs");
const SmartSocket = require("./SmartSocket");
const CommandFactory = require("./CommandFactory");
const HashHelper = require("./HashHelper");
const HeloResponse = require("./comModel/responseBody/HeloResponse");
const LoginResponse = require("./comModel/responseBody/LoginResponse");
class SmartSocketFactory {
	static async createSocketAndLogin(
		that,
		ipAddress,
		port,
		caFileName,
		username,
		password,
		cSymbol,
		shcVersion,
		shApiVersion,
		dataHandler,
		startKeepAlive,
		ignoreSslErrors,
	) {
		if (!dataHandler) {
			throw new Error("Missing dataHandler. Needed for Login.");
		}

		const socket = await this.createSocket(that, ipAddress, port, caFileName, dataHandler, ignoreSslErrors);

		try {
			const responseHelo = await socket.sendAndReceiveCommand(CommandFactory.default.createHeloCmd(username));

			if (!responseHelo.response) {
				throw new Error("JSON Parsing Message Error 1");
			}

			const parsedResponseHelo = HeloResponse.default.fromObject(responseHelo.response);

			if (!parsedResponseHelo?.salt || !parsedResponseHelo?.sessionSalt) {
				throw new Error("JSON Parsing Message Error 2");
			}

			const digest = HashHelper.default.calculateDigest(
				password,
				parsedResponseHelo.salt,
				parsedResponseHelo.sessionSalt,
			);

			const responseLogin = await socket.sendAndReceiveCommand(
				CommandFactory.default.createLoginCommand(username, digest, cSymbol, shcVersion, shApiVersion),
			);

			if (!responseLogin.response) {
				throw new Error("JSON Parsing Message Error 3");
			}

			const parsedResponseLogin = LoginResponse.default.fromObject(responseLogin.response);

			if (!parsedResponseLogin?.sessionID) {
				throw new Error("JSON Parsing Message Error 4");
			}

			await dataHandler.handleLoginMessage(parsedResponseLogin);

			if (startKeepAlive) {
				socket.startKeepAlive();
			}

			return socket;
		} catch (error) {
			socket.close();
			throw error;
		}
	}

	static createSocket(that, ipAddress, port, caFileName, dataHandler, ignoreSslErrors) {
		const caText = fs.readFileSync(`${__dirname}/${caFileName}`, "utf8");
		const socket = new SmartSocket.SmartSocket(that, ipAddress, port, caText, ignoreSslErrors);
		const returnPromise = new Promise((resolve, reject) => {
			socket
				.setupSocket(dataHandler)
				.then(() => {
					resolve(socket);
				})
				.catch(reason => {
					reject(reason);
				});
		});
		return returnPromise;
	}
}
exports.default = SmartSocketFactory;
