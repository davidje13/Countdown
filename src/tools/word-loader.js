import readline from 'readline';
import { letterOptions } from '../options.js';

// officially this should use the Oxford Dictionary of English (ODE), but
// instead we use a free wordlist source from Debian:

// curl http://launchpadlibrarian.net/83495812/wbritish-huge_7.1-1_all.deb > wb.deb
// ar -x wb.deb
// tar -xvf data.tar.gz
// mv usr/share/dict/british-english-huge wordlist
// rm -rf control.tar.gz data.tar.gz debian-binary usr/ var/ wb.deb
// node src/tools/word-loader.js < wordlist > src/solvers/letters/generated-data.js

const WORD_REGEX = /^[a-z]+$/;

function countAll(word, options) {
	let n = 0;
	for (const w of word) {
		for (const { c } of options) {
			if (w === c) {
				++ n;
				break;
			}
		}
	}
	return n;
}

const rl = readline.createInterface({ input: process.stdin });

function stringifyWithColLimit(list, limit) {
	let ln = '';
	const lines = []
	for (const item of list) {
		const s = JSON.stringify(item);
		if (ln !== '' && ln.length + s.length + 1 > limit) {
			lines.push(ln);
			ln = '';
		}
		ln += s + ',';
	}
	if (ln) {
		lines.push(ln);
	}
	return `[\n${lines.join('\n')}\n]`;
}

const words = [];
rl.on('line', (word) => {
	if (word.length > letterOptions.letterCount || !WORD_REGEX.test(word)) {
		return;
	}

	const vowels = countAll(word, letterOptions.vowels);
	const consonants = word.length - vowels;
	if (vowels > letterOptions.maxVowels || consonants > letterOptions.maxConsonants) {
		process.stderr.write(`skipping ${word}: ${vowels} vowels, ${consonants} consonants\n`);
		return;
	}
	words.push(word);
});

rl.on('close', () => {
	process.stdout.write('// generated file\n\n');
	process.stdout.write(`const words = ${stringifyWithColLimit(words, 300)};\n`);
});
