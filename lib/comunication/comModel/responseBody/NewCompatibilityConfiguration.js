"use strict";
//NewCompatibilityConfiguration.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class NewCompatibilityConfiguration {
    constructor(compatibilityConfigurationVersion) {
        this.compatibilityConfigurationVersion = compatibilityConfigurationVersion;
    }
    static fromObject(object) {
        return new NewCompatibilityConfiguration(object.compatibilityConfigurationVersion);
    }
}
exports.default = NewCompatibilityConfiguration;
//# sourceMappingURL=NewCompatibilityConfiguration.js.map