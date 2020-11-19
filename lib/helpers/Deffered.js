"use strict";
//Deffered.ts
//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Helper Class for promises
//modified from
//https://codereview.stackexchange.com/questions/105754/access-resolve-function-outside-of-a-javascript-promise
//--------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor(executor) {
        this.timeout = setTimeout(() => {
            this.reject("timeout");
        }, 5000);
        this.promise = new Promise((resolve, reject) => {
            this._resolveSelf = resolve;
            this._rejectSelf = reject;
        });
        executor.call(this, this._resolveSelf, this._rejectSelf);
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.promise.then(onrejected);
    }
    finally(onfinally) {
        return this.promise.finally(onfinally);
    }
    resolve(val) {
        clearTimeout(this.timeout);
        this._resolveSelf(val);
    }
    reject(reason) {
        clearTimeout(this.timeout);
        this._rejectSelf(reason);
    }
}
exports.default = Deferred;
//# sourceMappingURL=Deffered.js.map