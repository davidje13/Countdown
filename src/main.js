'use strict';

import NumbersUI from './NumbersUI.js';
import NumberPickerUI from './NumberPickerUI.js';

window.addEventListener('load', () => {
	const workerCount = 4;
	const workers = [];
	for (let i = 0; i < workerCount; ++ i) {
		workers.push(new AsyncFormulaFinder(COUNTDOWN_RULES));
	}

	const options = {
		inputCount: 6,
		minTarget: 101,
		maxTarget: 999,
	};

	const ui = new NumbersUI({
		...options,
		targetWorker: workers[0],
		solutionWorker: workers[1],
	});

	const numberPicker = new NumberPickerUI({
		...options,
		analysisWorkers: workers,
		selectionBig: [100, 75, 50, 25],
		selectionSmall: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
		presets: [
			{name: 'One from the top', selection: ['Bsssss']},
			{name: 'Two big, four small', selection: ['BBssss']},
			{name: 'Three big, three small', selection: ['BBBsss']},
			{name: 'Four big ones', selection: ['BBBBss']},
			{name: 'Six small', selection: ['ssssss']},
		],
	});

	numberPicker.addEventListener('choice', (e) => {
		ui.set(e.inputs);
	});

	document.body.appendChild(ui.dom());
	document.body.appendChild(numberPicker.dom());
	// 100, 75, 50, 25, 6, 3 -> 952
	// 100, 75, 50, 25, 9, 8 -> 490
}, {once: true});
