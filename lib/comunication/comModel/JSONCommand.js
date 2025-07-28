"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for easily gernating JSON Commands
//--------------------------------------------------

class JSONCommand {
	constructor(methode) {
		this.command = methode;
	}
	toString(sessionID) {
		if (sessionID) {
			this.sessionID = sessionID;
		}
		return JSON.stringify(this);
	}
}
exports.default = JSONCommand;
