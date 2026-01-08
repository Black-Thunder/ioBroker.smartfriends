"use strict";

//--------------------------------------------------
//Copyright 2020 Pascâl Hartmann
//See LICENSE File
//--------------------------------------------------
//Helper Class for promises
//modified from
//https://codereview.stackexchange.com/questions/105754/access-resolve-function-outside-of-a-javascript-promise
//--------------------------------------------------

class Deferred {
	constructor(adapter, executor, timeoutMs = 5000) {
		this.adapter = adapter;

		this.timeout = this.adapter.setTimeout(() => {
			this.reject("timeout");
		}, timeoutMs);

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
		this.adapter.clearTimeout(this.timeout);
		this._resolveSelf(val);
	}

	reject(reason) {
		this.adapter.clearTimeout(this.timeout);
		this._rejectSelf(reason);
	}
}
exports.default = Deferred;
