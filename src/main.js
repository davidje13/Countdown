'use strict';

const finder = new FormulaFinder(COUNTDOWN_RULES);

const minTarget = 101;
const maxTarget = 999;

function buildUI(defaultInputs, defaultTarget) {
	const form = document.createElement('form');
	form.setAttribute('action', '#');

	const inputFields = [];
	form.appendChild(document.createTextNode('Inputs: '));
	for (let i = 0; i < defaultInputs.length; ++ i) {
		const input = document.createElement('input');
		input.setAttribute('type', 'number');
		input.setAttribute('min', '1');
		input.setAttribute('max', '100');
		input.setAttribute('size', '3');
		input.setAttribute('value', defaultInputs[i]);
		form.appendChild(input);
		inputFields.push(input);
	}

	form.appendChild(document.createElement('br'));
	form.appendChild(document.createTextNode('Target: '));
	const targetField = document.createElement('input');
	targetField.setAttribute('type', 'number');
	targetField.setAttribute('min', minTarget);
	targetField.setAttribute('max', maxTarget);
	targetField.setAttribute('size', '6');
	targetField.setAttribute('value', defaultTarget);
	form.appendChild(targetField);

	form.appendChild(document.createTextNode(' '));
	const go = document.createElement('button');
	go.appendChild(document.createTextNode('go'));
	form.appendChild(go);

	const output = document.createElement('pre');
	form.appendChild(output);

	function calculate(inputs, target) {
		const tm0 = Date.now();
		const targets = finder.findTargets(inputs, {
			min: minTarget,
			max: maxTarget,
		});
		const tm1 = Date.now();
		const solutions = finder.findAllFormulas(inputs, target);
		const tm2 = Date.now();

		let message = '';

		if (solutions.length > 0) {
			solutions.sort((a, b) => (a.difficulty() - b.difficulty()));
			const easiest = solutions[0];
			const hardest = solutions[solutions.length - 1];

			solutions.sort((a, b) => (a.length() - b.length()));
			const shortest = solutions[0];

			message += easiest.toString();
			message += '-- calculated in ' + (tm2 - tm1) + 'ms\n\n';

			if (easiest.difficulty() + 500 < hardest.difficulty()) {
				message += 'Hardest method:\n' + hardest.toString() + '\n';
			}
			if (
				shortest.length() < easiest.length() &&
				shortest.length() < hardest.length()
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
		message += '-- calculated in ' + (tm1 - tm0) + 'ms\n\n';

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
		setTimeout(() => calculate(inputs, target), 0);
	}

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		beginCalculate();
	});
	beginCalculate();

	return form;
}

window.addEventListener('load', () => {
	document.body.appendChild(buildUI([100, 75, 50, 25, 6, 3], 952));
	// 100, 75, 50, 25, 9, 8 -> 490
});
