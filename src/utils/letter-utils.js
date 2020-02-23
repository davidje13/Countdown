export function count(word, c) {
	let n = 0;
	for (const w of word) {
		if (w === c) {
			++ n;
		}
	}
	return n;
}

export function countAll(word, options) {
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

export function optionsAfter(letters, options) {
	return options
		.map(({ c, p }) => ({ c, p: Math.max(0, p - count(letters, c)) }))
		.filter(({ p }) => (p > 0));
}
