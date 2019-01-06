'use strict';

function readNumeric(input) {
	return input.value|0;
}

function rnd(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

class NumbersUI {
	constructor({
		inputCount,
		minTarget,
		maxTarget,
		worker = null,
		targetWorker = null,
		solutionWorker = null,
	}) {
		this.form = make('form', {'class': 'numbers', 'action': '#'});
		this.inputFields = [];
		this.busy = false;
		this.flicker = null;
		this.minTarget = minTarget;
		this.maxTarget = maxTarget;
		this.targetWorker = targetWorker || worker;
		this.solutionWorker = solutionWorker || worker;
		this.flickerInterval = 80;
		this.minFlickerDuration = 800;

		const inputSection = make('div', {'class': 'input'});
		this.form.appendChild(inputSection);

		for (let i = 0; i < inputCount; ++ i) {
			const input = make('input', {
				'class': 'sourceNumber nodecoration',
				'type': 'number',
				'min': '1',
				'max': '100',
			});
			inputSection.appendChild(input);
			this.inputFields.push(input);
		}

		this.targetField = make('input', {
			'class': 'targetNumber nodecoration',
			'type': 'number',
			'min': minTarget,
			'max': maxTarget,
			'placeholder': '000',
		});
		inputSection.appendChild(this.targetField);

		this.go = make('button', {'class': 'calculate', 'title': 'Calculate'});
		inputSection.appendChild(this.go);

		this.output = make('div', {'class': 'output'});
		this.form.appendChild(this.output);

		this.form.addEventListener('submit', (e) => {
			e.preventDefault();
			const inputs = [];
			for (const inputField of this.inputFields) {
				const val = readNumeric(inputField);
				if (!val) {
					inputField.focus();
					return;
				}
				inputs.push(val);
			}
			if (this.busy) {
				return;
			}
			this._setBusy(true);
			if (this.targetField.value === '') {
				this._pickTarget(inputs);
			} else {
				this._calculate(inputs);
			}
		});
	}

	dom() {
		return this.form;
	}

	set(inputs, target = null) {
		if (inputs.length !== this.inputFields.length) {
			throw 'Bad input count: ' + inputs.length + ' != ' + this.inputFields.length;
		}
		for (let i = 0; i < inputs.length; ++ i) {
			this.inputFields[i].value = inputs[i];
		}
		this.setTarget(target);
		this.setOutput('');
	}

	setTarget(target) {
		clearInterval(this.flicker);
		this.flicker = null;
		this.targetField.value = target || '';
	}

	_setBusy(busy) {
		this.go.disabled = busy;
		this.busy = busy;
	}

	setOutput(msg) {
		this.output.textContent = msg;
	}

	_pickTarget(inputs) {
		this.setOutput('');
		clearInterval(this.flicker);
		this.flicker = setInterval(() => {
			this.targetField.value = rnd(this.minTarget, this.maxTarget + 1);
		}, this.flickerInterval);

		const beginTime = Date.now();

		this.targetWorker.findTargets(inputs, {
			min: this.minTarget,
			max: this.maxTarget,
		}).then(({targets}) => {
			const chosen = targets.length ? targets[rnd(0, targets.length)].value : null;

			setTimeout(() => {
				this.setTarget(chosen);
				this.setOutput('');
				this._setBusy(false);
			}, Math.max(beginTime + this.minFlickerDuration - Date.now(), 0));
		});
	}

	_calculate(inputs) {
		this.setOutput('Calculating\u2026');

		const target = readNumeric(this.targetField);

		Promise.all([
			this.targetWorker.findTargets(inputs, {
				min: this.minTarget,
				max: this.maxTarget,
			}),
			this.solutionWorker.findAllFormulas(inputs, target),
		]).then(([targetData, solutionsData]) => {
			this._displayResults(
				targetData.targets,
				targetData.time,
				solutionsData.solutions,
				solutionsData.time
			);
		});
	}

	_displayResults(targets, targetsTime, solutions, solutionsTime) {
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

		this.setOutput(message);
		this._setBusy(false);
	}
}
