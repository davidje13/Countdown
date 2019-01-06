'use strict';

import {make} from './dom.js';

function representGame(inputs, game) {
	return inputs.join(',') + ' -> ' + game.value;
}

function _choices(list, count, begin, pos, storage, fn) {
	if (pos === count) {
		fn(storage.slice());
		return;
	}
	let last = null;
	for (let i = begin; i < list.length; ++ i) {
		const v = list[i];
		if (v !== last) {
			storage[pos] = last = v;
			_choices(list, count, i + 1, pos + 1, storage, fn);
		}
	}
}

function choices(list, count, fn) {
	const vs = list.slice();
	vs.sort((a, b) => a - b);
	const temp = [];
	_choices(vs, count, 0, 0, temp, fn);
}

export default class NumberPickerUI extends EventTarget {
	constructor({
		inputCount,
		minTarget,
		maxTarget,
		analysisWorkers,
		selectionBig,
		selectionSmall,
		presets,
	}) {
		super();
		this.inputCount = inputCount;
		this.minTarget = minTarget;
		this.maxTarget = maxTarget;
		this.analysisWorkers = analysisWorkers;
		this.selectionBig = selectionBig;
		this.selectionSmall = selectionSmall;
		this.batchSize = 10;

		this.form = make('form', {'class': 'number-choices', 'action': '#'});

		this.analyse = make('button');
		this.analyse.appendChild(document.createTextNode('Analyse all possible games (SLOW!)'));
		this.form.appendChild(this.analyse);

		this.output = make('pre');
		this.form.appendChild(this.output);

		this.analyse.addEventListener('click', (e) => {
			e.preventDefault();
			this.analyseAll();
		});
	}

	dom() {
		return this.form;
	}

	setOutput(msg) {
		this.output.textContent = msg;
	}

	_sendChoice(inputs) {
		this.dispatchEvent(new CustomEvent('choice', {inputs}));
	}

	analyseAll() {
		this.analyse.disabled = true;

		const tm0 = Date.now();

		const selection = [...this.selectionBig, ...this.selectionSmall];
		const games = [];
		choices(selection, this.inputCount, (inputs) => games.push(inputs));
		const totalGames = games.length;

		const impossible = [];
		const results = [];
		let inFlight = 0;

		const nextBatch = (worker) => {
			if (games.length === 0) {
				if ((-- inFlight) === 0) {
					this._displayResults(results, impossible, Date.now() - tm0);
				}
				return;
			}

			this.setOutput(
				'Analysing ' + totalGames + ' games\u2026 ' +
				(totalGames - games.length) + ' / ' + totalGames
			);

			const batch = games.splice(-this.batchSize);
			worker.analyse(batch, {
				min: this.minTarget,
				max: this.maxTarget,
			}).then(({analysis}) => {
				for (const a of analysis) {
					if (a.achievable === 0) {
						impossible.push(a.inputs);
					} else {
						results.push(a);
					}
				}
				nextBatch(worker);
			});
		}

		for (const worker of this.analysisWorkers) {
			++ inFlight;
			nextBatch(worker);
		}
	}

	_displayResults(results, impossible, time) {
		results.sort((a, b) => (a.easiest.difficulty - b.easiest.difficulty));
		const easiest = results[0];
		const hardestNumbers = results[results.length - 1];

		results.sort((a, b) => (a.hardest.difficulty - b.hardest.difficulty));
		const easiestNumbers = results[0];
		const hardest = results[results.length - 1];

		results.sort((a, b) => (a.averageDifficulty - b.averageDifficulty));
		const easiestAverage = results[0];
		const hardestAverage = results[results.length - 1];

		this.setOutput(
			'Total permutations: ' + (results.length + impossible.length) + '\n' +
			'Impossible numbers:\n' + impossible.map((l) => l.join(',')).join('\n') + '\n' +
			'Easiest game: ' + representGame(easiest.inputs, easiest.easiest) + '\n' +
			'Hardest game: ' + representGame(hardest.inputs, hardest.hardest) + '\n' +
			'Easiest numbers: ' + easiestNumbers.inputs.join(',') + '\n' +
			'Hardest numbers: ' + hardestNumbers.inputs.join(',') + '\n' +
			'Typically easiest numbers: ' + easiestAverage.inputs.join(',') + '\n' +
			'Typically hardest numbers: ' + hardestAverage.inputs.join(',') + '\n' +

			'-- ' + (time * 0.001).toFixed(3) + 's ' +
			'(' + (time * 0.001 / results.length).toFixed(3) + 's per game)\n'
		);
	}
};
