"use strict";
//NewLanguageTranslation.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LanguageTranslation_1 = __importDefault(require("./LanguageTranslation"));
class NewLanguageTranslation {
    constructor(languageTranslationVersion, newTranslatedStrings) {
        this.languageTranslationVersion = languageTranslationVersion;
        this.newTranslatedStrings = newTranslatedStrings;
    }
    static fromObject(object) {
        let tempValues = [];
        if (object.newTranslatedStrings && (typeof object.newTranslatedStrings[Symbol.iterator] === 'function')) {
            for (let valueEntry of object.newTranslatedStrings) {
                tempValues.push(LanguageTranslation_1.default.fromObject(valueEntry));
            }
        }
        return new NewLanguageTranslation(object.languageTranslationVersion, tempValues);
    }
}
exports.default = NewLanguageTranslation;
//# sourceMappingURL=NewLanguageTranslation.js.map