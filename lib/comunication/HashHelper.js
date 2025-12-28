"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Helper class to deal with all kind of hashing and
//salt nonsense the gateway requires to login a
//user
//--------------------------------------------------

const crypto = require("crypto");

class HashHelper {
	static calculateDigest(password, salt, sessionSalt) {
		const hashedPassword = this.getHash("sha256", password, salt);
		return this.getHash("sha1", hashedPassword, sessionSalt);
	}

	static getHash(method, password, saltBase64) {
		const saltBuffer = Buffer.from(saltBase64, "base64");
		const passwordBuffer = Buffer.from(password, "utf8");

		const combined = Buffer.concat([passwordBuffer, saltBuffer]);

		return crypto.createHash(method).update(combined).digest("base64");
	}
}

exports.default = HashHelper;
