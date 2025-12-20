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
		// also different formats possible, e.g.: { "programmingProcess" : { "context" : "system-update", "items" : [ { "button" : { "kind" : "OK_BUTTON", "requestID" : 12, "text" : "Ja" } }, { "button" : { "kind" : "CANCEL_BUTTON", "requestID" : -4, "text" : "Nein" } } ], "nextCommand" : "changeServerSettings", "target" : "ServerSettingsHandler", "text" : "Die verwendeten App erfordert eine neuere Version der Zentrale.\n\nBitte installieren sie umgehend das neueste Update\nSoll nach updates gesucht werden?", "title" : "${Note}" }, "responseCode" : 6 }
		const timestampRaw = object?.currentTimestamp ?? object?.response?.currentTimestamp ?? null;
		const timestamp = timestampRaw ? JSONHelper.default.stringToDate(timestampRaw) : null;

		return new JSONResponse(timestamp, object.response, object.responseCode, object.responseMessage);
	}
}
exports.default = JSONResponse;
