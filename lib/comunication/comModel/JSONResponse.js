"use strict";
//JSONResponse.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for Response answers
//--------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JSONHelper_js_1 = __importDefault(require("./JSONHelper.js"));
class JSONResponse {
    constructor(currentTimestamp, response, responseCode, responseMessage) {
        this.currentTimestamp = currentTimestamp;
        this.response = response;
        this.responseCode = responseCode;
        this.responseMessage = responseMessage;
    }
    static fromJSONString(json) {
        let jsonObject = JSON.parse(json);
        return this.fromObject(jsonObject);
    }
    static fromObject(object) {
        return new JSONResponse(JSONHelper_js_1.default.stringToDate(object.currentTimestamp), object.response, object.responseCode, object.responseMessage);
    }
}
exports.default = JSONResponse;
//# sourceMappingURL=JSONResponse.js.map