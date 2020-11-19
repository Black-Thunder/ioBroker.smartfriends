"use strict";
//HashHelper.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Helper class to deal with all kind of hashing and
//salt nonsense the gateway requires to login a
//user
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const base_64_1 = __importDefault(require("base-64"));
class HashHelper {
    static calculateDigest(password, salt, sessionSalt) {
        const hashedPassword = this.getHash('sha256', password, salt);
        return this.getHash('sha1', hashedPassword, sessionSalt);
    }
    // https://stackoverflow.com/questions/3195865 modified because of javascript handling chars differently
    static string2Bin(str) {
        let result = [];
        for (let i = 0; i < str.length; i++) {
            let p = str.charCodeAt(i);
            console.log(p);
            if (p > 128) {
                result.push(p - 256);
            }
            else {
                result.push(p);
            }
        }
        return result;
    }
    static getHash(method, password, salt) {
        let decode = base_64_1.default.decode(salt);
        let saltArray = this.string2Bin(decode);
        let passwordArray = this.string2Bin(password);
        let pasConSalt = passwordArray.concat(saltArray);
        let test = new Uint8Array(pasConSalt);
        let cryptHash = crypto_1.default.createHash(method).update(new Uint8Array(pasConSalt));
        return cryptHash.digest('base64');
    }
}
exports.default = HashHelper;
//# sourceMappingURL=HashHelper.js.map