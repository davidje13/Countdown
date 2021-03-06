import readline from 'readline';
import { letterOptions } from '../options.js';
import { count, countAll } from '../utils/letter-utils.js';

// officially this should use the Oxford Dictionary of English (ODE), but
// instead we use a free wordlist source from Debian:

const WORD_REGEX = /^[a-z]+$/;
const allLetters = [...letterOptions.vowels, ...letterOptions.consonants];

const rl = readline.createInterface({ input: process.stdin });

const colLimit = 300;
let curLineLength = 0;

process.stdout.write(`const ${process.argv[2] || 'words'} = [\n`);

function checkWord(word) {
	if (word.length > letterOptions.letterCount || !WORD_REGEX.test(word)) {
		return false;
	}

	const vowels = countAll(word, letterOptions.vowels);
	const consonants = word.length - vowels;
	if (vowels > letterOptions.maxVowels || consonants > letterOptions.maxConsonants) {
		process.stderr.write(`skipping ${word}: ${vowels} vowels, ${consonants} consonants\n`);
		return false;
	}
	for (const { c, p } of allLetters) {
		const n = count(word, c);
		if (n > p) {
			process.stderr.write(`skipping ${word}: ${n} * ${c} (${p} available)\n`);
			return false;
		}
	}

	return true;
}

function writeWord(word) {
	const fragment = JSON.stringify(word) + ',';
	if (curLineLength > 0 && curLineLength + fragment.length > colLimit) {
		process.stdout.write('\n');
		curLineLength = 0;
	}
	process.stdout.write(fragment);
	curLineLength += fragment.length;
}

rl.on('line', (word) => {
	if (checkWord(word)) {
		writeWord(word);
	}
});

rl.on('close', () => {
	process.stdout.write('\n];\n');
});
