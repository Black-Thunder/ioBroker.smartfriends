"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

class LanguageTranslation {
	constructor(key, value) {
		this.key = key;
		this.value = value;
	}
	static fromObject(object) {
		return new LanguageTranslation(object.key, object.value);
	}
}
exports.default = LanguageTranslation;