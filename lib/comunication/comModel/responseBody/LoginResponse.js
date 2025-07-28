"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------

class LoginResponse {
	constructor(hardware, macAddress, pushNotificationUrl, sessionID, shsVersion) {
		this.hardware = hardware;
		this.macAddress = macAddress;
		this.pushNotificationUrl = pushNotificationUrl;
		this.sessionID = sessionID;
		this.shsVersion = shsVersion;
	}
	static fromObject(object) {
		return new LoginResponse(
			object.hardware,
			object.macAddress,
			object.pushNotificationUrl,
			object.sessionID,
			object.shsVersion,
		);
	}
}
exports.default = LoginResponse;
