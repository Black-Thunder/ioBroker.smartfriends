"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

class NewCompatibilityConfiguration {
	constructor(compatibilityConfigurationVersion) {
		this.compatibilityConfigurationVersion = compatibilityConfigurationVersion;
	}
	static fromObject(object) {
		return new NewCompatibilityConfiguration(object.compatibilityConfigurationVersion);
	}
}
exports.default = NewCompatibilityConfiguration;