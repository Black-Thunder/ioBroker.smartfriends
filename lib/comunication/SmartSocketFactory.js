"use strict";
//SmartSocketFactory.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

const SmartSocket = require("./SmartSocket");
//const fs = require("fs");
const CommandFactory = require("./CommandFactory");
const HashHelper = require("./HashHelper");
const HeloResponse = require("./comModel/responseBody/HeloResponse");
const LoginResponse = require("./comModel/responseBody/LoginResponse");
class SmartSocketFactory {
	static createSocketAndLogin(ipAddress, port, caPath, username, password, cSymbol, shcVersion, shApiVersion, dataHandler, startKeepAlive) {
		const returnPromise = new Promise((resolve, reject) => {
			if (dataHandler) {
				this.createSocket(ipAddress, port, caPath, dataHandler)
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
	static createSocket(ipAddress, port, caPath, dataHandler) {
		//const caText = fs.readFileSync(caPath, "utf8");
		const caText = "-----BEGIN CERTIFICATE----- \
        MIIDpTCCAo2gAwIBAgIICt0RIQj4rs4wDQYJKoZIhvcNAQENBQAwYDEWMBQGA1UE \
        AwwNZW5leG9tYS1yb290MjETMBEGA1UECgwKZW5leG9tYSBBRzEWMBQGA1UEBwwN \
        T2VybGluZ2hhdXNlbjEMMAoGA1UECAwDTlJXMQswCQYDVQQGEwJERTAeFw0xNjEw \
        MjcwNzU4MjZaFw0zNjEwMjcwNzU4MjZaMGAxFjAUBgNVBAMMDWVuZXhvbWEtcm9v \
        dDIxEzARBgNVBAoMCmVuZXhvbWEgQUcxFjAUBgNVBAcMDU9lcmxpbmdoYXVzZW4x \
        DDAKBgNVBAgMA05SVzELMAkGA1UEBhMCREUwggEiMA0GCSqGSIb3DQEBAQUAA4IB \
        DwAwggEKAoIBAQC2vOt1yNINfhjmbNvRgi3jqTOYvlpyN0Av1GTKpSPNOOPgAGk+ \
        eHSmp0hYTv3nBlRVii9Nk01JGPqJ9lwChzqWiTsd4P16RIzd+zD844ali36ErgJF \
        cexPWsQr0S3pCj9f42DGXaKj6oyh5E4DRkCBQVSpMq1N6+PvaE3OFQ22feFdogoK \
        Q5UAyTFUbiUSegkYYA0BmFT/s8EuCR/brkzsnuGZayEuOzsr43mnM4K+vhoYcfQJ \
        ure+bxmX6IdCk9hmPWuTWiia0FU9D8ji76FYHvqcCbcmuF5OMPKZMfvI/ZUUpAdk \
        daE0EF/c98cmlUH7ENSgrCTm87r4OqfAc3nHAgMBAAGjYzBhMA8GA1UdEwEB/wQF \
        MAMBAf8wHwYDVR0jBBgwFoAUtfMSXYZtNoCKmyteKTbltqhiYn8wHQYDVR0OBBYE \
        FLXzEl2GbTaAipsrXik25baoYmJ/MA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0B \
        AQ0FAAOCAQEAWulfbz+++2h5UenfIkEvY8p5Ye1Nsk7rkNUAROCrsleeoJgGDF/i \
        mJSZ2yIhIpZISesW0T96pqzHJYzKucO4lct+K2nPrxXdF7vK9U61fp5tdCQqRwop \
        evPKYAfdhyLERPV01xaFwPzO2xnXBcZHk25L7Yrhuwd2rjRPJ9ObVlfgBqQGvJie \
        IyZ6XzsoAOHbEXdeodRg8LJSU5cWKgSqJ2PjVc+sVsixao0keNcKX0nwKRSRUvCd \
        aEnBwKdjQdoUYqfnfCKrMwZRHn/ILuZ1qMWrsVPUlfwDGJf7GybvqVxIJjrDjF7+ \
        SwrYYoRq7ApJQPkqU0Gt8UIGW7Hluh8QzQ==  \
		-----END CERTIFICATE-----";
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
//# sourceMappingURL=SmartSocketFactory.js.map