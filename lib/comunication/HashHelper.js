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

const crypto = require("crypto");
const base_64 = require("base-64");
class HashHelper {
	static calculateDigest(password, salt, sessionSalt) {
		const hashedPassword = this.getHash("sha256", password, salt);
		return this.getHash("sha1", hashedPassword, sessionSalt);
	}
	// https://stackoverflow.com/questions/3195865 modified because of javascript handling chars differently
	static string2Bin(str) {
		const result = [];
		for (let i = 0; i < str.length; i++) {
			const p = str.charCodeAt(i);
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
		const decode = base_64.decode(salt);
		const saltArray = this.string2Bin(decode);
		const passwordArray = this.string2Bin(password);
		const pasConSalt = passwordArray.concat(saltArray);
		const cryptHash = crypto.createHash(method).update(new Uint8Array(pasConSalt));
		return cryptHash.digest("base64");
	}
}
exports.default = HashHelper;