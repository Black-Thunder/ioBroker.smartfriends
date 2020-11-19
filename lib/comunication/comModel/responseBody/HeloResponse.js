"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

class HeloResponse {
	constructor(salt, sessionSalt) {
		this.salt = salt;
		this.sessionSalt = sessionSalt;
	}
	static fromObject(object) {
		return new HeloResponse(object.salt, object.sessionSalt);
	}
}
exports.default = HeloResponse;