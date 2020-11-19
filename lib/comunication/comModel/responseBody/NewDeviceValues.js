"use strict";
//NewDeviceValues.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeviceValue_1 = __importDefault(require("./DeviceValue"));
class NewDeviceValues {
    constructor(values) {
        this.values = values;
    }
    static fromObject(object) {
        let tempValues = [];
        for (let valueEntry of object) {
            tempValues.push(DeviceValue_1.default.fromObject(valueEntry));
        }
        return new NewDeviceValues(tempValues);
    }
}
exports.default = NewDeviceValues;
//# sourceMappingURL=NewDeviceValues.js.map