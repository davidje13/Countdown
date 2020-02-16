'use strict';

import {make} from './dom.js';

const LETTER_REGEX = /^[a-z]$/;

function rnd(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function pickRandom(list) {
	return list[rnd(0, list.length)];
}

const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';

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

		const vowel = make('button', { 'class': 'vowel', 'type': 'button' });
		const consonant = make('button', { 'class': 'consonant', 'type': 'button' });

		vowel.addEventListener('click', () => {
			this.addLetter(pickRandom(VOWELS));
		});
		consonant.addEventListener('click', () => {
			this.addLetter(pickRandom(CONSONANTS));
		});

		frame.appendChild(inputSection);
		frame.appendChild(outputSection);
		frame.appendChild(vowel);
		frame.appendChild(consonant);
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
	}
};
