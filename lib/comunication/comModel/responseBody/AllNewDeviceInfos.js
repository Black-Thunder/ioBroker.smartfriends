"use strict";
//JSONAllNewDeviceInfo.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for Response answers
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JSONHelper_js_1 = __importDefault(require("../JSONHelper.js"));
const NewCompatibilityConfiguration_js_1 = __importDefault(require("./NewCompatibilityConfiguration.js"));
const NewDeviceInfos_js_1 = __importDefault(require("./NewDeviceInfos.js"));
const NewDeviceValues_js_1 = __importDefault(require("./NewDeviceValues.js"));
const NewLanguageTranslation_js_1 = __importDefault(require("./NewLanguageTranslation.js"));
class AllNewDeviceInfos {
    constructor(currentTimestamp, newCompatibilityConfiguration, newDeviceInfos, newDeviceValues, newLanguageTranslation) {
        this.currentTimestamp = currentTimestamp;
        this.newCompatibilityConfiguration = newCompatibilityConfiguration;
        this.newDeviceInfos = newDeviceInfos;
        this.newDeviceValues = newDeviceValues;
        this.newLanguageTranslations = newLanguageTranslation;
    }
    static fromObject(object) {
        return new AllNewDeviceInfos(JSONHelper_js_1.default.stringToDate(object.currentTimestamp), NewCompatibilityConfiguration_js_1.default.fromObject(object.newCompatibilityConfiguration), NewDeviceInfos_js_1.default.fromObject(object.newDeviceInfos), NewDeviceValues_js_1.default.fromObject(object.newDeviceValues), NewLanguageTranslation_js_1.default.fromObject(object.newLanguageTranslation));
    }
}
exports.default = AllNewDeviceInfos;
//# sourceMappingURL=AllNewDeviceInfos.js.map