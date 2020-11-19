"use strict";
//CommandFactory.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Uses Command Wrapper to generate JSON-Commands
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDeviceValueCommand = exports.allNewInfoCommand = exports.loginCommand = exports.heloCommand = void 0;
const JSONCommand_js_1 = __importDefault(require("./comModel/JSONCommand.js"));
const JSONHelper_js_1 = __importDefault(require("./comModel/JSONHelper.js"));
class CommandFactory {
    static createLoginCommand(username, digest, cSymbol, shcVersion, shApiVersion) {
        return new loginCommand(username, digest, cSymbol, shcVersion, shApiVersion);
    }
    static createAllNewInfoCmd(timestamp, compatibilityConfigurationVersion, languageTranslationVersion) {
        return new allNewInfoCommand(JSONHelper_js_1.default.dateToString(timestamp), compatibilityConfigurationVersion, languageTranslationVersion);
    }
    static createSetDeviceValueCmd(inDeviceId, inValue) {
        return new setDeviceValueCommand(inDeviceId, inValue);
    }
    static createupdateAllDeviceValues() {
        return new JSONCommand_js_1.default("keepalive");
    }
    static createGetComptibilityConfigurationCmd() {
        return new JSONCommand_js_1.default("getCompatibilityConfiguration");
    }
    static createLogoutCmd() {
        return new JSONCommand_js_1.default("logout");
    }
    static createKeepAliveCmd() {
        return new JSONCommand_js_1.default("keepalive");
    }
    static createHeloCmd(username) {
        return new heloCommand(username);
    }
}
exports.default = CommandFactory;
class heloCommand extends JSONCommand_js_1.default {
    constructor(username) {
        super('helo');
        this.username = username;
    }
}
exports.heloCommand = heloCommand;
class loginCommand extends JSONCommand_js_1.default {
    constructor(username, digest, cSymbol, shcVersion, shApiVersion) {
        super('login');
        this.username = username;
        this.digest = digest;
        this.cSymbol = cSymbol;
        this.shcVersion = shcVersion;
        this.shApiVersion = shApiVersion;
    }
}
exports.loginCommand = loginCommand;
class allNewInfoCommand extends JSONCommand_js_1.default {
    constructor(timestamp, compatibilityConfigurationVersion, languageTranslationVersion) {
        super('getAllNewInfos');
        this.timestamp = timestamp;
        this.compatibilityConfigurationVersion = compatibilityConfigurationVersion;
        this.languageTranslationVersion = languageTranslationVersion;
    }
}
exports.allNewInfoCommand = allNewInfoCommand;
class setDeviceValueCommand extends JSONCommand_js_1.default {
    constructor(deviceID, value) {
        super('setDeviceValue');
        this.deviceID = deviceID;
        this.value = value;
    }
}
exports.setDeviceValueCommand = setDeviceValueCommand;
//TODO: implementation nedded
//class executeDeviceCmdCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class newDeviceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class changeDeviceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class changeRoomCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class deleteRoomCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class newSwitchingSequenceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class changeSwitchingSequenceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class deleteSwitchingSequenceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//class activateSwitchingSequenceCmd extends Command{
//    constructor(){
//        super('')
//    }
//}
//# sourceMappingURL=CommandFactory.js.map