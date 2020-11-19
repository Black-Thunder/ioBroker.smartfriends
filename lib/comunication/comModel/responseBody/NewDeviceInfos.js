"use strict";
//NewDeviceInfos.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeviceInfo_1 = __importDefault(require("./DeviceInfo"));
class NewDeviceInfos {
    constructor(values) {
        this.values = values;
    }
    static fromObject(object) {
        let tempValues = [];
        for (let valueEntry of object) {
            tempValues.push(DeviceInfo_1.default.fromObject(valueEntry));
        }
        return new NewDeviceInfos(tempValues);
    }
}
exports.default = NewDeviceInfos;
//# sourceMappingURL=NewDeviceInfos.js.map