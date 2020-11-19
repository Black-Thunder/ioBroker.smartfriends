"use strict";
//DeviceInfo.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class DeviceInfo {
    constructor(deviceID, deviceName, masterDeviceID, masterDeviceName, manufacture, deviceDesignation, deviceTypClient, firstLevel) {
        this.deviceID = deviceID;
        this.deviceName = deviceName;
        this.masterDeviceID = masterDeviceID;
        this.masterDeviceName = masterDeviceName;
        this.manufacture = manufacture;
        this.deviceDesignation = deviceDesignation;
        this.deviceTypClient = deviceTypClient;
        this.firstLevel = firstLevel;
    }
    static fromObject(object) {
        return new DeviceInfo(object.deviceID, object.deviceName, object.masterDeviceID, object.masterDeviceName, object.manufacture, object.deviceDesignation, object.deviceTypClient, object.firstLevel);
    }
}
exports.default = DeviceInfo;
//# sourceMappingURL=DeviceInfo.js.map