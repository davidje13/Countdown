'use strict';

import {make, block, paragraph} from './dom.js';
import {formulaDom} from './formulaPrinter.js';

function readNumeric(input) {
	return input.value|0;
}

function rnd(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function pickRandom(list) {
	return list[rnd(0, list.length)];
}

function waitUntil(time) {
	return (data) => new Promise((resolve) => {
		setTimeout(() => resolve(data), time - Date.now());
	});
}

export default class NumbersUI {
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
				'class': 'tile nodecoration',
				'type': 'number',
				'required': 'required',
				'min': '1',
				'max': '100',
				'placeholder': ' ',
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
			this.calculate();
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

	_showFlickeringTarget() {
		clearInterval(this.flicker);
		this.flicker = setInterval(() => {
			this.targetField.value = rnd(this.minTarget, this.maxTarget + 1);
		}, this.flickerInterval);
	}

	_setBusy(busy) {
		this.go.disabled = busy;
		this.busy = busy;
	}

	setOutput(msg) {
		this.output.textContent = msg;
	}

	calculate() {
		if (this.busy) {
			return false;
		}
		const inputs = this.inputFields.map(readNumeric);
		if (this.targetField.value === '') {
			this._pickTarget(inputs);
		} else {
			const target = readNumeric(this.targetField);
			this._solve(inputs, target);
		}
		return true;
	}

	_pickTarget(inputs) {
		this.setOutput('');
		this._showFlickeringTarget();

		const options = {min: this.minTarget, max: this.maxTarget};

		this._setBusy(true);
		this.targetWorker.findTargets(inputs, options)
			.then(waitUntil(Date.now() + this.minFlickerDuration))
			.then(({targets, time}) => {
				const target = targets.length ? pickRandom(targets).value : null;
				this.setTarget(target);
				this._showTargetInfo(targets, target, time);
				this._setBusy(false);
			});
	}

	_showTargetInfo(targets, target, time) {
		const allTargets = this.maxTarget + 1 - this.minTarget;

		let message = (
			'Possible to solve ' + targets.length +
			' of ' + allTargets + ' targets\n\n'
		);

		targets.sort((a, b) => (a.difficulty - b.difficulty));
		const targetValues = targets.map((t) => t.value);

		if (!targets.length) {
			message = 'No solvable targets!\n\n';
		} else if (targets.length === 1) {
			message = (
				'One solvable target:\n\n' +
				targetValues[0] + '\n\n'
			);
		} else if (targets.length <= 20) {
			message += (
				'All possible targets (easiest to hardest):\n\n' +
				targetValues.join(', ') + '\n\n'
			);
		} else {
			const sample = Math.min(Math.floor(targets.length / 2), 20);
			message += (
				'Easiest targets:\n' +
				targetValues.slice(0, sample).join(', ') + '\n\n'
			);
			targetValues.reverse();
			message += (
				'Hardest targets:\n' +
				targetValues.slice(0, sample).join(', ') + '\n\n'
			);

			if (targets.length < allTargets) {
				message += 'Impossible targets:\n';
				const allTargets = new Set(targetValues);
				for (let v = this.minTarget; v <= this.maxTarget; ++ v) {
					if (!allTargets.has(v)) {
						message += v + ', ';
					}
				}
				message = message.substr(0, message.length - 2) + '\n\n';
			}
		}

		this.setOutput(message + '\u2014 calculated in ' + time + 'ms');
	}

	_solve(inputs, target) {
		this.setOutput('Calculating\u2026');

		this._setBusy(true);
		this.solutionWorker.findAllNearest(inputs, target)
			.then(({solutions, time}) => {
				this._showSolution(solutions, target, time);
				this._setBusy(false);
			});
	}

	_showSolution(solutions, target, time) {
		let message = '';
		this.setOutput('');

		if (!solutions.length) {
			this.output.appendChild(paragraph('No solution!'));
		} else {
			const sampleResult = solutions[0].result();
			if (sampleResult !== target) {
				this.output.appendChild(paragraph('No exact solution!'));
				this.output.appendChild(block('h2', `${Math.abs(sampleResult - target)} away:`));
			}

			solutions.sort((a, b) => (a.difficulty - b.difficulty));
			const easiest = solutions[0];
			const hardest = solutions[solutions.length - 1];

			solutions.sort((a, b) => (a.length - b.length));
			const shortest = solutions[0];

			this.output.appendChild(formulaDom(easiest));

			if (easiest.difficulty + 500 < hardest.difficulty) {
				this.output.appendChild(block('h3', 'Hardest method:'));
				this.output.appendChild(formulaDom(hardest));
			}
			if (
				shortest.length < easiest.length &&
				shortest.length < hardest.length
			) {
				this.output.appendChild(block('h3', 'Shortest method:'));
				this.output.appendChild(formulaDom(shortest));
			}
		}

		let count = '';
		if (solutions.length === 1) {
			count = '1 solution';
		} else {
			count = solutions.length + ' solutions';
		}
		this.output.appendChild(paragraph(`\u2014 ${count} calculated in ${time}ms`));
	}
};
