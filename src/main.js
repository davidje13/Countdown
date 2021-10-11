'use strict';

import NumbersUI from './NumbersUI.js';
import NumberPickerUI from './NumberPickerUI.js';
import LettersUI from './LettersUI.js';
import {
	numberOptions,
	numberPickerOptions,
	letterOptions,
} from './options.js';

const numberWorkerCount = 4;
const numberWorkers = [];
for (let i = 0; i < numberWorkerCount; ++ i) {
	numberWorkers.push(new AsyncFormulaFinder(COUNTDOWN_RULES));
}

const numbersUI = new NumbersUI({
	...numberOptions,
	targetWorker: numberWorkers[0],
	solutionWorker: numberWorkers[1],
});

const numberPicker = new NumberPickerUI({
	...numberOptions,
	analysisWorkers: numberWorkers,
});

numberPicker.addEventListener('choice', (e) => {
	numbersUI.set(e.inputs);
});

const letterWorker = new AsyncWordFinder();
const lettersUI = new LettersUI({
	...letterOptions,
	worker: letterWorker,
});

document.body.appendChild(numbersUI.dom());
document.body.appendChild(lettersUI.dom());
//document.body.appendChild(numberPicker.dom());

// 100, 75, 50, 25, 6, 3 -> 952
// 100, 75, 50, 25, 9, 8 -> 490
