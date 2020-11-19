"use strict";
//DeviceValue.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JSONHelper_js_1 = __importDefault(require("../JSONHelper.js"));
class DeviceValue {
    constructor(deviceID, masterDeviceID, value, valueTimestamp) {
        this.deviceID = deviceID;
        this.masterDeviceID = masterDeviceID;
        this.value = value;
        this.valueTimestamp = valueTimestamp;
    }
    static fromObject(object) {
        return new DeviceValue(object.deviceID, object.masterDeviceID, object.value, JSONHelper_js_1.default.stringToDate(object.valueTimestamp));
    }
}
exports.default = DeviceValue;
//# sourceMappingURL=DeviceValue.js.map