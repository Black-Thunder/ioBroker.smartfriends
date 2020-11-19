"use strict";
//JSONResponse.ts
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
		return new JSONResponse(JSONHelper.default.stringToDate(object.currentTimestamp), object.response, object.responseCode, object.responseMessage);
	}
}
exports.default = JSONResponse;