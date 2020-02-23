'use strict';

const NUMBERS_WORKER_SCRIPT = './src/solvers/numbers/worker.js';

class AsyncFormulaFinder {
	constructor(operators) {
		if (operators !== COUNTDOWN_RULES) {
			throw 'AsyncFormulaFinder currently only supports COUNTDOWN_RULES';
		}
		this.worker = null;
		this.awaiting = [];
		this._handleResponse = this._handleResponse.bind(this);
	}

	_post(message) {
		if (this.worker === null) {
			this.worker = new Worker(NUMBERS_WORKER_SCRIPT);
			this.worker.addEventListener('message', this._handleResponse);
		}
		return new Promise((resolve, reject) => {
			this.awaiting.push({resolve, reject});
			this.worker.postMessage(message);
		});
	}

	_handleResponse({data}) {
		this.awaiting.shift().resolve(data);
	}

	abort() {
		if (this.worker === null) {
			return;
		}
		this.worker.terminate();
		this.worker = null;
		for (const {reject} of this.awaiting) {
			reject('aborted');
		}
		this.awaiting.length = 0;
	}

	findAllFormulas(inputs, target) {
		return this.findAllNearest(inputs, target, { maxDist: 0 });
	}

	findAllNearest(inputs, target, options) {
		return this._post({
			type: 'SOLVE',
			inputs,
			target,
			options,
		}).then(({solutions, time}) => ({
			solutions: solutions.map(Formula.fromJSON),
			time,
		}));
	}

	findTargets(inputs, {min = 1, max = Number.POSITIVE_INFINITY} = {}) {
		return this._post({
			type: 'TARGETS',
			inputs,
			options: {min, max},
		});
	}

	analyse(games, {min = 1, max = Number.POSITIVE_INFINITY} = {}) {
		return this._post({
			type: 'ANALYSE',
			games,
			options: {min, max},
		});
	}
}
