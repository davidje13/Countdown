'use strict';

const workerCount = 4;
const workers = [];
for (let i = 0; i < workerCount; ++ i) {
	workers.push(new AsyncFormulaFinder(COUNTDOWN_RULES));
}

const minTarget = 101;
const maxTarget = 999;

function buildAnalyser(selection, inputCount) {
	const form = make('form');
	form.setAttribute('action', '#');

	const go = make('button');
	go.appendChild(document.createTextNode('Analyse all possible games (SLOW!)'));
	form.appendChild(go);

	const output = make('pre');
	form.appendChild(output);

	function calculate() {
		analyseGames(selection, inputCount, (txt) => {
			output.textContent = txt;
		});
	}

	function beginCalculate() {
		go.disabled = true;
		output.textContent = 'Calculating\u2026 (may take several minutes)';
		setTimeout(calculate, 0);
	}

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		beginCalculate();
	});

	return form;
}

const selectionBig = [100, 75, 50, 25];
const selectionSmall = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];

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

function analyseGames(selection, inputCount, callback) {
	const games = [];

	const tm0 = Date.now();
	choices(selection, inputCount, (inputs) => games.push(inputs));
	const totalGames = games.length;

	const batchSize = 10;

	const impossible = [];
	const results = [];

	function nextBatch(worker) {
		if (games.length === 0) {
			if ((-- inFlight) === 0) {
				finish();
			}
			return;
		}

		callback(
			'Analysing ' + totalGames + ' games... ' +
			(totalGames - games.length) + ' / ' + totalGames
		);

		const batch = games.splice(-batchSize);
		worker.analyse(batch, {
			min: minTarget,
			max: maxTarget,
		}).then(({analysis, time}) => {
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

	function finish() {
		const tm1 = Date.now();

		results.sort((a, b) => (a.easiest.difficulty - b.easiest.difficulty));
		const easiest = results[0];
		const hardestNumbers = results[results.length - 1];

		results.sort((a, b) => (a.hardest.difficulty - b.hardest.difficulty));
		const easiestNumbers = results[0];
		const hardest = results[results.length - 1];

		results.sort((a, b) => (a.averageDifficulty - b.averageDifficulty));
		const easiestAverage = results[0];
		const hardestAverage = results[results.length - 1];

		function representGame(inputs, game) {
			return inputs.join(',') + ' -> ' + game.value;
		}

		callback(
			'Total permutations: ' + (results.length + impossible.length) + '\n' +
			'Impossible numbers:\n' + impossible.map((l) => l.join(',')).join('\n') + '\n' +
			'Easiest game: ' + representGame(easiest.inputs, easiest.easiest) + '\n' +
			'Hardest game: ' + representGame(hardest.inputs, hardest.hardest) + '\n' +
			'Easiest numbers: ' + easiestNumbers.inputs.join(',') + '\n' +
			'Hardest numbers: ' + hardestNumbers.inputs.join(',') + '\n' +
			'Typically easiest numbers: ' + easiestAverage.inputs.join(',') + '\n' +
			'Typically hardest numbers: ' + hardestAverage.inputs.join(',') + '\n' +

			'-- ' + ((tm1 - tm0) * 0.001).toFixed(3) + 's ' +
			'(' + ((tm1 - tm0) * 0.001 / results.length).toFixed(3) + 's per game)\n'
		);
	}

	let inFlight = 0;
	for (const worker of workers) {
		++ inFlight;
		nextBatch(worker);
	}
}

const ui = new NumbersUI({
	inputCount: 6,
	minTarget: 101,
	maxTarget: 999,
	targetWorker: workers[0],
	solutionWorker: workers[1],
});

window.addEventListener('load', () => {
	document.body.appendChild(buildAnalyser([...selectionBig, ...selectionSmall], 6));
	document.body.appendChild(ui.dom());
	// 100, 75, 50, 25, 6, 3 -> 952
	// 100, 75, 50, 25, 9, 8 -> 490
});
