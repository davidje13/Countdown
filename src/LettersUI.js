'use strict';

import {make, block, paragraph, textnode} from './dom.js';
import {count, countAll, optionsAfter} from './utils/letter-utils.js';

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

const BLANK = { word: '', freq: 0 };

export default class LettersUI {
	constructor({
		worker = null,
		letterCount,
		maxVowels,
		maxConsonants,
		vowels,
		consonants,
	}) {
		this.form = make('form', {'class': 'letters', 'action': '#'});
		this.inputFields = [];
		this.outputFields = [];
		this.worker = worker;
		this.maxVowels = maxVowels;
		this.maxConsonants = maxConsonants;
		this.vowels = vowels;
		this.consonants = consonants;
		this.lastCalcLetters = '';

		const frame = make('div', {'class': 'frame'});
		const inputSection = make('div', {'class': 'input'});
		const outputSection = make('div', {'class': 'output'});

		for (let i = 0; i < letterCount; ++ i) {
			const thisI = i;
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
				if (input.value.length > 0 && thisI + 1 < this.inputFields.length) {
					this.inputFields[thisI + 1].focus();
				}
			});

			input.addEventListener('paste', (e) => {
				e.preventDefault();
				const pasted = e.clipboardData.getData('text')
					.toLowerCase()
					.replace(/[^a-z]/g, '');

				const limit = Math.min(pasted.length, this.inputFields.length - thisI);
				for (let j = 0; j < limit; ++ j) {
					this.inputFields[thisI + j].value = pasted[j];
				}
				const next = Math.min(thisI + pasted.length, this.inputFields.length - 1);
				this.inputFields[next].focus();
				this.calculate();
			});

			input.addEventListener('keydown', (e) => {
				switch (e.key) {
				case 'ArrowLeft':
					if (thisI > 0) {
						e.preventDefault();
						this.inputFields[thisI - 1].focus();
						this.inputFields[thisI - 1].select();
					}
					break;
				case 'ArrowRight':
					if (thisI + 1 < this.inputFields.length) {
						e.preventDefault();
						this.inputFields[thisI + 1].focus();
						this.inputFields[thisI + 1].select();
					}
					break;
				case 'Backspace':
					if (thisI > 0 && !input.value) {
						e.preventDefault();
						this.inputFields[thisI - 1].value = '';
						this.inputFields[thisI - 1].focus();
						this.calculate();
					}
					break;
				}
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
			this.addLetter(pickRandom(this.remaining(this.vowels)));
		});
		this.consonant.addEventListener('click', () => {
			this.addLetter(pickRandom(this.remaining(this.consonants)));
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

		this.highlightNextOptimal('');
	}

	dom() {
		return this.form;
	}

	setOutputLetters(word) {
		for (let i = 0; i < this.outputFields.length; ++ i) {
			this.outputFields[i].value = word[i] || '';
		}
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
			this.output.textContent = '';

			// display longest non-risky word
			solutions.sort((a, b) => {
				return (
					((b.freq > 1) - (a.freq > 1)) ||
					(b.word.length - a.word.length) ||
					(b.freq - a.freq)
				);
			});

			this.setOutputLetters((solutions[0] || BLANK).word);

			// display all words from longest to shortest, safest to riskiest
			solutions.sort((a, b) => {
				return (
					(b.word.length - a.word.length) ||
					(b.freq - a.freq)
				);
			});

			const wordsOut = paragraph();
			let nonRiskyLength = -1;
			for (const wordInfo of solutions) {
				const risky = wordInfo.freq <= 1;
				if (risky) {
					if (wordInfo.word.length === nonRiskyLength) {
						// don't show risky words if we already have
						// non-risky words which are just as good
						continue;
					}
				} else {
					nonRiskyLength = wordInfo.word.length;
				}

				wordsOut.appendChild(block('span', wordInfo.word, {
					'class': risky ? 'risky word' : 'word',
					title: risky ? 'risky' : '',
				}));
				wordsOut.appendChild(textnode(', '));
			}
			if (wordsOut.lastChild) {
				wordsOut.removeChild(wordsOut.lastChild);
			}
			this.output.appendChild(wordsOut);

			let count = '';
			if (solutions.length === 1) {
				count = '1 solution';
			} else {
				count = solutions.length + ' solutions';
			}
			this.output.appendChild(paragraph(
				`${count} calculated in ${time}ms (${initTime}ms to warm up)`,
			));
		});

		this.highlightNextOptimal(letters);
	}

	highlightNextOptimal(letters) {
		this._highlightBucket(null);

		const remaining = this.inputFields.length - letters.length;
		if (remaining <= 0) {
			return;
		}

		const vowelCount = countAll(letters, this.vowels);
		const consonantCount = letters.length - vowelCount;
		const minVowels = this.inputFields.length - this.maxConsonants;
		const minConsonants = this.inputFields.length - this.maxVowels;

		if (vowelCount >= this.maxVowels || consonantCount < minConsonants) {
			if (vowelCount < minVowels) {
				// need more vowels and consonants to fulfil limits;
				// not a real choice (since both a vowel and consonant are needed)
				// pick best option for immediate word finding
				this.worker.pickBestGroup(
					letters,
					[this.vowels, this.consonants],
					1,
				).then(({ choice, advantage, time }) => {
					this._highlightBucket(choice === 1 ? 'CONSONANT' : 'VOWEL');
				});
			} else {
				// need more consonants to fulfil limits
				this._highlightBucket('CONSONANT');
			}
		} else if (consonantCount >= this.maxConsonants || vowelCount < minVowels) {
			// need more vowels to fulfil limits
			this._highlightBucket('VOWEL');
		} else if (remaining <= 4) {
			// free choice of vowel/consonant; pick for best expected word length
			this.worker.pickBestGroup(
				letters,
				[this.vowels, this.consonants],
				remaining,
			).then(({ choice, advantage, time }) => {
				if (advantage < 0.0001) {
					this._highlightBucket(null);
				} else {
					this._highlightBucket(choice === 1 ? 'CONSONANT' : 'VOWEL');
				}
			});
		}
	}
};
