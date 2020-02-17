'use strict';

import {make} from './dom.js';

const LETTER_REGEX = /^[a-z]$/;

function pickRandom(list) {
	let t = 0;
	for (const { p } of list) {
		t += p;
	}
	const r = Math.random() * t;
	t = 0;
	for (const { c, p } of list) {
		t += p;
		if (t > r) {
			return c;
		}
	}
	// rounding errors could cause fall-through, so just return the last element
	return list[list.length - 1].c;
}

const VOWELS = [
	{ c: 'a', p: 15 },
	{ c: 'e', p: 21 },
	{ c: 'i', p: 13 },
	{ c: 'o', p: 13 },
	{ c: 'u', p: 5 },
];
const CONSONANTS = [
	{ c: 'b', p: 2 },
	{ c: 'c', p: 3 },
	{ c: 'd', p: 6 },
	{ c: 'f', p: 2 },
	{ c: 'g', p: 3 },
	{ c: 'h', p: 2 },
	{ c: 'j', p: 1 },
	{ c: 'k', p: 1 },
	{ c: 'l', p: 5 },
	{ c: 'm', p: 4 },
	{ c: 'n', p: 8 },
	{ c: 'p', p: 4 },
	{ c: 'q', p: 1 },
	{ c: 'r', p: 9 },
	{ c: 's', p: 9 },
	{ c: 't', p: 9 },
	{ c: 'v', p: 1 },
	{ c: 'w', p: 1 },
	{ c: 'x', p: 1 },
	{ c: 'y', p: 1 },
	{ c: 'z', p: 1 },
];

function count(word, c) {
	let n = 0;
	for (const w of word) {
		if (w === c) {
			++ n;
		}
	}
	return n;
}

function optionsAfter(letters, options) {
	return options.map(({ c, p }) => {
		return { c, p: Math.max(0, p - count(letters, c)) };
	});
}

function addOptions(base, options) {
	const r = [];
	for (const { c, p } of options) {
		r.push({ letters: base + c, p });
	}
	return r;
}

export default class LettersUI {
	constructor({
		worker = null,
		letterCount,
	}) {
		this.form = make('form', {'class': 'letters', 'action': '#'});
		this.inputFields = [];
		this.outputFields = [];
		this.worker = worker;
		this.lastCalcLetters = '';

		const frame = make('div', {'class': 'frame'});
		const inputSection = make('div', {'class': 'input'});
		const outputSection = make('div', {'class': 'output'});

		for (let i = 0; i < letterCount; ++ i) {
			const input = make('input', {
				'class': 'tile',
				'type': 'text',
				'required': 'required',
				'maxlength': '1',
				'pattern': '[a-zA-Z]',
				'placeholder': ' ',
			});

			input.addEventListener('input', () => {
				this.calculate();
			});

			inputSection.appendChild(input);
			this.inputFields.push(input);

			const output = make('input', {
				'class': 'tile',
				'type': 'text',
				'readonly': 'readonly',
				'placeholder': ' ',
			});

			outputSection.appendChild(output);
			this.outputFields.push(output);
		}

		this.output = make('div', {'class': 'output-all'});

		this.vowel = make('button', { 'class': 'vowel', 'type': 'button' });
		this.consonant = make('button', { 'class': 'consonant', 'type': 'button' });

		this.vowel.addEventListener('click', () => {
			this.addLetter(pickRandom(this.remaining(VOWELS)));
		});
		this.consonant.addEventListener('click', () => {
			this.addLetter(pickRandom(this.remaining(CONSONANTS)));
		});

		frame.appendChild(inputSection);
		frame.appendChild(outputSection);
		frame.appendChild(this.vowel);
		frame.appendChild(this.consonant);
		this.form.appendChild(frame);
		this.form.appendChild(this.output);

		this.form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.calculate();
		});
	}

	dom() {
		return this.form;
	}

	setOutputLetters(word) {
		for (let i = 0; i < this.outputFields.length; ++ i) {
			this.outputFields[i].value = word[i] || '';
		}
	}

	setOutputMessage(msg) {
		this.output.textContent = msg;
	}

	_getLetters() {
		return this.inputFields
			.map((f) => f.value.toLowerCase())
			.filter((v) => LETTER_REGEX.test(v))
			.join('');
	}

	addLetter(c) {
		for (let i = 0; i < this.inputFields.length; ++ i) {
			if (!this.inputFields[i].value) {
				this.inputFields[i].value = c;
				this.calculate();
				return;
			}
		}
	}

	_highlightBucket(bucket) {
		this.vowel.className = `vowel ${bucket === 'VOWEL' ? 'highlight' : ''}`
		this.consonant.className = `consonant ${bucket === 'CONSONANT' ? 'highlight' : ''}`
	}

	remaining(options) {
		return optionsAfter(this.lastCalcLetters, options);
	}

	calculate() {
		const letters = this._getLetters();
		if (letters === this.lastCalcLetters) {
			return;
		}
		this.lastCalcLetters = letters;

		this.output.textContent = 'Calculating\u2026';

		this.worker.findWords(letters).then(({ solutions, time, initTime }) => {
			let count = '';
			if (solutions.length === 1) {
				count = '1 solution';
			} else {
				count = solutions.length + ' solutions';
			}
			const topWords = solutions.slice(0, 50);
			this.setOutputLetters(topWords[0] || '');
			this.setOutputMessage(`${topWords.join('\n')}\n\n${count} calculated in ${time}ms (${initTime}ms to warm up)`);
		});

		this._highlightBucket(null);

		if (letters.length >= 3 && letters.length < this.inputFields.length) {
			const remainingVowels = this.remaining(VOWELS);
			const remainingConsonants = this.remaining(CONSONANTS);
			Promise.all([
				this.worker.calculateExpected(addOptions(letters, remainingVowels)),
				this.worker.calculateExpected(addOptions(letters, remainingConsonants)),
			]).then(([v, c]) => {
				if (Math.abs(v.weighted - c.weighted) < 0.01) {
					this._highlightBucket(null);
				} else if (v.weighted > c.weighted) {
					this._highlightBucket('VOWEL');
				} else {
					this._highlightBucket('CONSONANT');
				}
			});
		}
	}
};
