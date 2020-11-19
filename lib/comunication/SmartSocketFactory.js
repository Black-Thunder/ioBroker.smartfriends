"use strict";
//SmartSocketFactory.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SmartSocket_1 = __importDefault(require("./SmartSocket"));
const fs_1 = __importDefault(require("fs"));
const CommandFactory_1 = __importDefault(require("./CommandFactory"));
const HashHelper_1 = __importDefault(require("./HashHelper"));
const HeloResponse_1 = __importDefault(require("./comModel/responseBody/HeloResponse"));
const LoginResponse_1 = __importDefault(require("./comModel/responseBody/LoginResponse"));
class SmartSocketFactory {
    static createSocketAndLogin(ipAddress, port, caPath, username, password, cSymbol, shcVersion, shApiVersion, dataHandler, startKeepAlive) {
        var returnPromise = new Promise((resolve, reject) => {
            if (dataHandler) {
                this.createSocket(ipAddress, port, caPath, dataHandler)
                    .catch(reason => {
                    reject(reason);
                })
                    .then(socket => {
                    if (socket) {
                        socket.sendAndRecieveCommand(CommandFactory_1.default.createHeloCmd(username))
                            .then(responseHelo => {
                            if (responseHelo.response) {
                                let parsedResponseHelo = HeloResponse_1.default.fromObject(responseHelo.response);
                                if (parsedResponseHelo && parsedResponseHelo.salt && parsedResponseHelo.sessionSalt) {
                                    let digest = HashHelper_1.default.calculateDigest(password, parsedResponseHelo.salt, parsedResponseHelo.sessionSalt);
                                    socket.sendAndRecieveCommand(CommandFactory_1.default.createLoginCommand(username, digest, cSymbol, shcVersion, shApiVersion))
                                        .then(responseLogin => {
                                        if (responseLogin.response) {
                                            let parsedResponseLogin = LoginResponse_1.default.fromObject(responseLogin.response);
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
        var caText = fs_1.default.readFileSync(caPath, 'utf8');
        var socket = new SmartSocket_1.default(ipAddress, port, caText);
        var returnPromise = new Promise((resolve, reject) => {
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