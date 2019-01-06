'use strict';

const workerCount = 4;
const workers = [];
for (let i = 0; i < workerCount; ++ i) {
	workers.push(new AsyncFormulaFinder(COUNTDOWN_RULES));
}

const minTarget = 101;
const maxTarget = 999;

function make(type, attrs = {}) {
	const o = document.createElement(type);
	for (const attr in attrs) {
		o.setAttribute(attr, attrs[attr]);
	}
	return o;
}

function buildUI(defaultInputs, defaultTarget) {
	const form = make('form', {'class': 'numbers', 'action': '#'});

	const inputSection = make('div', {'class': 'input'});
	form.appendChild(inputSection);

	const inputFields = [];
	for (let i = 0; i < defaultInputs.length; ++ i) {
		const input = make('input', {
			'class': 'sourceNumber',
			'type': 'number',
			'min': '1',
			'max': '100',
			'value': defaultInputs[i],
		});
		inputSection.appendChild(input);
		inputFields.push(input);
	}

	const targetField = make('input', {
		'class': 'targetNumber',
		'min': minTarget,
		'max': maxTarget,
		'value': defaultTarget,
		'placeholder': '000',
	});
	inputSection.appendChild(targetField);

	const go = make('button', {'class': 'calculate', 'title': 'Calculate'});
	inputSection.appendChild(go);

	const output = make('div', {'class': 'output'});
	form.appendChild(output);

	function showOutput(targets, targetsTime, solutions, solutionsTime) {
		let message = '';

		if (solutions.length > 0) {
			solutions.sort((a, b) => (a.difficulty - b.difficulty));
			const easiest = solutions[0];
			const hardest = solutions[solutions.length - 1];

			solutions.sort((a, b) => (a.length - b.length));
			const shortest = solutions[0];

			message += easiest.toString();
			message += '-- calculated in ' + solutionsTime + 'ms\n\n';

			if (easiest.difficulty + 500 < hardest.difficulty) {
				message += 'Hardest method:\n' + hardest.toString() + '\n';
			}
			if (
				shortest.length < easiest.length &&
				shortest.length < hardest.length
			) {
				message += 'Shortest method:\n' + shortest.toString() + '\n';
			}
		} else {
			message += 'No solution!\n\n';
		}

		targets.sort((a, b) => (b.difficulty - a.difficulty));
		message += 'Other possible targets (hardest first):\n';
		for (let i = 0; i < Math.min(targets.length, 20); ++ i) {
			message += targets[i].value + '\n';
		}
		message += '-- calculated in ' + targetsTime + 'ms\n\n';

		const impossibleCount = maxTarget - minTarget + 1 - targets.length;
		if (impossibleCount > 0) {
			message += 'Impossible targets (' + impossibleCount + '):\n';
			const allTargets = new Set();
			targets.forEach((i) => allTargets.add(i.value));
			for (let v = minTarget; v <= maxTarget; ++ v) {
				if (!allTargets.has(v)) {
					message += v + '\n';
				}
			}
		}

		output.textContent = message;
	}

	function beginCalculate() {
		output.textContent = 'Calculating\u2026';
		const inputs = [];
		for (const inputField of inputFields) {
			inputs.push(inputField.value|0);
		}
		const target = targetField.value|0;

		Promise.all([
			workers[0].findTargets(inputs, {
				min: minTarget,
				max: maxTarget,
			}),
			workers[1].findAllFormulas(inputs, target),
		]).then(([targetData, solutionsData]) => {
			showOutput(
				targetData.targets,
				targetData.time,
				solutionsData.solutions,
				solutionsData.time
			);
		});
	}

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		beginCalculate();
	});
	beginCalculate();

	return form;
}

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

window.addEventListener('load', () => {
	document.body.appendChild(buildAnalyser([...selectionBig, ...selectionSmall], 6));
	document.body.appendChild(buildUI([100, 75, 50, 25, 6, 3], 952));
	// 100, 75, 50, 25, 9, 8 -> 490
});
