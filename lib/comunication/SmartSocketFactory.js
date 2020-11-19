"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

const SmartSocket = require("./SmartSocket");
const fs = require("fs");
const CommandFactory = require("./CommandFactory");
const HashHelper = require("./HashHelper");
const HeloResponse = require("./comModel/responseBody/HeloResponse");
const LoginResponse = require("./comModel/responseBody/LoginResponse");
class SmartSocketFactory {
	static createSocketAndLogin(ipAddress, port, caFileName, username, password, cSymbol, shcVersion, shApiVersion, dataHandler, startKeepAlive) {
		const returnPromise = new Promise((resolve, reject) => {
			if (dataHandler) {
				this.createSocket(ipAddress, port, caFileName, dataHandler)
					.catch(reason => {
						reject(reason);
					})
					.then(socket => {
						if (socket) {
							socket.sendAndRecieveCommand(CommandFactory.default.createHeloCmd(username))
								.then(responseHelo => {
									if (responseHelo.response) {
										const parsedResponseHelo = HeloResponse.default.fromObject(responseHelo.response);
										if (parsedResponseHelo && parsedResponseHelo.salt && parsedResponseHelo.sessionSalt) {
											const digest = HashHelper.default.calculateDigest(password, parsedResponseHelo.salt, parsedResponseHelo.sessionSalt);
											socket.sendAndRecieveCommand(CommandFactory.default.createLoginCommand(username, digest, cSymbol, shcVersion, shApiVersion))
												.then(responseLogin => {
													if (responseLogin.response) {
														const parsedResponseLogin = LoginResponse.default.fromObject(responseLogin.response);
														if (parsedResponseLogin && parsedResponseLogin.sessionID) {
															dataHandler.handleLoginMessage(parsedResponseLogin);
															if (startKeepAlive) {
																socket.startKeepAlive();
															}
															resolve(socket);
														}
														else {
															reject("JSON Parsing Message Error 4");
														}
													}
													else {
														reject("JSON Parsing Message Error 3");
													}
												})
												.catch((reason) => {
													reject(reason);
												});
										}
										else {
											reject("JSON Parsing Message Error 2");
										}
									}
									else {
										reject("JSON Parsing Message Error 1");
									}
								})
								.catch(reason => {
									reject(reason);
								});
						}
					});
			}
			else {
				reject("Missing dataHandler. Needed for Login.");
			}
		});
		return returnPromise;
	}
	static createSocket(ipAddress, port, caFileName, dataHandler) {
		const caText = fs.readFileSync(__dirname + "/" + caFileName, "utf8");
		const socket = new SmartSocket.SmartSocket(ipAddress, port, caText);
		const returnPromise = new Promise((resolve, reject) => {
			socket.setupSocket(dataHandler)
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