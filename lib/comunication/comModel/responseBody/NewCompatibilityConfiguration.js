"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

class NewCompatibilityConfiguration {
	constructor(compatibilityConfigurationVersion, compatibleRadioStandards = []) {
		this.compatibilityConfigurationVersion = compatibilityConfigurationVersion;
		this.compatibleRadioStandards = compatibleRadioStandards;
	}

	static fromObject(object) {
		return new NewCompatibilityConfiguration(
			object.compatibilityConfigurationVersion,
			object.compatibleRadioStandards ?? [],
		);
	}
}
exports.default = NewCompatibilityConfiguration;
