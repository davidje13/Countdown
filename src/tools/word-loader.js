const readline = require('readline');

// officially this should use the Oxford Dictionary of English (ODE), but
// instead we use a free wordlist source from Debian:

// curl http://launchpadlibrarian.net/83495812/wbritish-huge_7.1-1_all.deb > wb.deb
// ar -x wb.deb
// tar -xvf data.tar.gz
// mv usr/share/dict/british-english-huge wordlist
// rm -rf control.tar.gz data.tar.gz debian-binary usr/ var/ wb.deb
// node src/tools/word-loader.js < wordlist > src/solvers/letters/generated-data.js

const MAX_LENGTH = 9;
const MAX_VOWELS = 5;
const MAX_CONSONANTS = 7;
const WORD_REGEX = /^[a-z]+$/;
const VOWEL_REGEX = /[aeiou]/g

function countMatches(str, reg) {
	const m = str.match(reg);
	return m ? m.length : 0;
}

const rl = readline.createInterface({ input: process.stdin });

const words = [];
rl.on('line', (word) => {
	if (word.length > MAX_LENGTH || !WORD_REGEX.test(word)) {
		return;
	}

	const vowels = countMatches(word, VOWEL_REGEX);
	const consonants = word.length - vowels;
	if (vowels > MAX_VOWELS || consonants > MAX_CONSONANTS) {
		process.stderr.write(`skipping ${word}: ${vowels} vowels, ${consonants} consonants\n`);
		return;
	}
	words.push(word);
});

rl.on('close', () => {
	process.stdout.write('// generated file\n\n');
	process.stdout.write(`const words = ${JSON.stringify(words)};\n`);
});
