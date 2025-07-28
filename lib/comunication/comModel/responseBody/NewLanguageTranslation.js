"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
const LanguageTranslation = require("./LanguageTranslation");
class NewLanguageTranslation {
	constructor(languageTranslationVersion, newTranslatedStrings) {
		this.languageTranslationVersion = languageTranslationVersion;
		this.newTranslatedStrings = newTranslatedStrings;
	}
	static fromObject(object) {
		const tempValues = [];
		if (object.newTranslatedStrings && typeof object.newTranslatedStrings[Symbol.iterator] === "function") {
			for (const valueEntry of object.newTranslatedStrings) {
				tempValues.push(LanguageTranslation.default.fromObject(valueEntry));
			}
		}
		return new NewLanguageTranslation(object.languageTranslationVersion, tempValues);
	}
}
exports.default = NewLanguageTranslation;
