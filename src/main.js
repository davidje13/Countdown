'use strict';

import NumbersUI from './NumbersUI.js';
import NumberPickerUI from './NumberPickerUI.js';
import LettersUI from './LettersUI.js';

const numberWorkerCount = 4;
const numberWorkers = [];
for (let i = 0; i < numberWorkerCount; ++ i) {
	numberWorkers.push(new AsyncFormulaFinder(COUNTDOWN_RULES));
}

const numberOptions = {
	inputCount: 6,
	minTarget: 101,
	maxTarget: 999,
};

const numbersUI = new NumbersUI({
	...numberOptions,
	targetWorker: numberWorkers[0],
	solutionWorker: numberWorkers[1],
});

const numberPicker = new NumberPickerUI({
	...numberOptions,
	analysisWorkers: numberWorkers,
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
	numbersUI.set(e.inputs);
});

const letterWorker = new AsyncWordFinder();
const lettersUI = new LettersUI({
	worker: letterWorker,
	letterCount: 9,
});

document.body.appendChild(numbersUI.dom());
document.body.appendChild(numberPicker.dom());
document.body.appendChild(lettersUI.dom());

// 100, 75, 50, 25, 6, 3 -> 952
// 100, 75, 50, 25, 9, 8 -> 490
