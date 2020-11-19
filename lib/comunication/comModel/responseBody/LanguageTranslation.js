"use strict";
//LanguageTranslation.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=LanguageTranslation.js.map