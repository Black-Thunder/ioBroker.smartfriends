"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for Response answers
//--------------------------------------------------
const JSONHelper = require("./JSONHelper.js");
class JSONResponse {
	constructor(currentTimestamp, response, responseCode, responseMessage) {
		this.currentTimestamp = currentTimestamp;
		this.response = response;
		this.responseCode = responseCode;
		this.responseMessage = responseMessage;
	}
	static fromJSONString(json) {
		const jsonObject = JSON.parse(json);
		return this.fromObject(jsonObject);
	}
	static fromObject(object) {
		// e.g.: { "error" : { "message" : "The TLS/SSL connection has been closed", "responseCode" : 84 } }
		if (object.error != null) {
			return new JSONResponse(null, object.error, object.error.responseCode, object.error.message);
		}

		// e.g.: { "success" : { "messageId" : "remoteHome.connected", "responseCode" : 203 } }
		if (object.success != null) {
			return new JSONResponse(null, object.success, object.success.responseCode, object.success.messageId);
		}

		// e.g.: { "currentTimestamp" : 20201210140021, "response" : { "remoteHomeActivated" : true, "remoteHomeStatus" : "notConnected" }, "responseCode" : 1, "responseMessage" : "success" }
		return new JSONResponse(
			JSONHelper.default.stringToDate(
				object.currentTimestamp ? object.currentTimestamp : object.response.currentTimestamp,
			),
			object.response,
			object.responseCode,
			object.responseMessage,
		);
	}
}
exports.default = JSONResponse;
