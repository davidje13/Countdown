'use strict';

const LETTERS_WORKER_SCRIPT = './src/solvers/letters/worker.js';

class AsyncWordFinder {
	constructor() {
		this.worker = new Worker(LETTERS_WORKER_SCRIPT);
		this.awaiting = [];
		this._handleResponse = this._handleResponse.bind(this);
		this.worker.addEventListener('message', this._handleResponse);
	}

	_post(message) {
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

	findExact(letters) {
		return this._post({ type: 'SOLVE_EXACT', letters });
	}

	findWords(letters) {
		return this._post({ type: 'SOLVE', letters });
	}

	pickBestGroup(letters, groups, count) {
		return this._post({ type: 'PICK_BEST', letters, groups, count });
	}
}
