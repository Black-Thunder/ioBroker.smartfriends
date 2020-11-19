"use strict";
//JSONCommand.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Wrapper for easily gernating JSON Commands
//--------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=JSONCommand.js.map