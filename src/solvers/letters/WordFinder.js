'use strict';

function normalise(word) {
	return word.split('').sort().join('');
}

function getSortedLetters(words) {
	const letters = new Set();
	for (const norm of words) {
		for (const c of norm) {
			letters.add(c);
		}
	}
	return normalise([...letters.values()].join(''));
}

function searchEnd(list, low, high, depth, c) {
	// boundary is typically early in the list, so we use a
	// linear search rather than a binary search
	for (let p = low; p < high; ++ p) {
		if (list[p].n[depth] !== c) {
			return p;
		}
	}
	return high;
}

function makeWordTreeR(sortedNorms, sortedLetters, letterPos, depth, normsFrom, normsTo) {
	let w = undefined;
	if (sortedNorms[normsFrom].n.length === depth) {
		w = sortedNorms[normsFrom].w;
		++ normsFrom;
	}

	const n = {};
	for (let i = letterPos; i < sortedLetters.length && normsFrom < normsTo; ++ i) {
		const c = sortedLetters[i];
		const p = searchEnd(sortedNorms, normsFrom, normsTo, depth, c);
		if (p > normsFrom) {
			n[c] = makeWordTreeR(sortedNorms, sortedLetters, i, depth + 1, normsFrom, p);
			normsFrom = p;
		}
	}

	return { w, n };
}

function makeWordTree(normedMap) {
	const sortedLetters = getSortedLetters(normedMap.keys());
	const sortedNorms = [...normedMap.entries()].map(([n, w]) => ({ n, w }));
	sortedNorms.sort((a, b) => (a.n > b.n ? 1 : -1));
	return makeWordTreeR(sortedNorms, sortedLetters, 0, 0, 0, sortedNorms.length);
}

function makeNormedMap(words) {
	const normedMap = new Map();
	for (const wordInfo of words) {
		const norm = normalise(wordInfo.word);
		let s = normedMap.get(norm);
		if (!s) {
			s = [];
			normedMap.set(norm, s);
		}
		s.push(wordInfo);
	}
	return normedMap;
}

function traverse(tree, letters, pos, r) {
	if (tree.w) {
		r.push(...tree.w);
	}
	const next = tree.n;
	let skip = '';
	for (let i = pos; i < letters.length; ++ i) {
		const c = letters[i];
		if (c === skip) {
			continue;
		}
		skip = c;
		const n = next[c];
		if (n) {
			traverse(n, letters, i + 1, r);
		}
	}
}

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
	return options
		.map(({ c, p }) => ({ c, p: Math.max(0, p - count(letters, c)) }))
		.filter(({ p }) => (p > 0));
}

function average(options) {
	let t = 0;
	let s = 0;
	for (const { p, v } of options) {
		t += p;
		s += v * p;
	}
	return (t > 0) ? (s / t) : 0;
}

class WordFinder {
	constructor(words) {
		this.normedMap = makeNormedMap(words);
		this.wordTree = makeWordTree(this.normedMap);
	}

	findExact(letters) {
		return this.normedMap.get(normalise(letters)) || [];
	}

	findWords(letters) {
		const r = [];
		traverse(this.wordTree, normalise(letters), 0, r);
		return r;
	}

	_findBestLengthNormed(norm) {
		const r = [];
		traverse(this.wordTree, norm, 0, r);
		let l = 0;
		for (const wordInfo of r) {
			l = Math.max(l, wordInfo.word.length);
		}
		return l;
	}

	_pickBestGroup(norm, groups, n, cache) {
		const cached = cache.get(norm);
		if (cached) {
			return cached;
		}

		if (n <= 0) {
			const r = {
				length: this._findBestLengthNormed(norm),
				choice: null,
				advantage: 0,
			};
			cache.set(norm, r);
			return r;
		}

		let bestLength = 0;
		let bestChoice = null;
		let worstLength = Number.POSITIVE_INFINITY;
		for (let i = 0; i < groups.length; ++ i) {
			const characterOptions = optionsAfter(norm, groups[i]);
			const expected = average(characterOptions.map(({ p, c }) => ({
				p,
				v: this._pickBestGroup(
					normalise(norm + c),
					groups,
					n - 1,
					cache,
				).length,
			})));

			if (expected > bestLength) {
				bestLength = expected;
				bestChoice = i;
			}
			if (expected < worstLength) {
				worstLength = expected;
			}
		}

		const r = {
			length: bestLength,
			choice: bestChoice,
			advantage: bestLength - worstLength,
		};
		cache.set(norm, r);
		return r;
	}

	pickBestGroup(letters, groups, count) {
		return this._pickBestGroup(normalise(letters), groups, count, new Map());
	}
}
