'use strict';

function normalise(word) {
	return word.toLowerCase().split('').sort().join('');
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
	for (const word of words) {
		const norm = normalise(word);
		let s = normedMap.get(norm);
		if (!s) {
			s = [];
			normedMap.set(norm, s);
		}
		s.push(word);
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
		r.sort((a, b) => (b.length - a.length));
		return r;
	}
}
