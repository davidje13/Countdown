'use strict';

const cachedA = new Map();
const cachedM = new Map();

function aComplexity(value) {
	let m = cachedA.get(value);
	if (m !== undefined) {
		return m;
	}

	let c = 0;
	while ((value % 10) === 0) {
		value /= 10;
		++ c;
	}
	c += value * 10;
	cachedA.set(value, c);
	return c;
}

function mComplexity(value) {
	let m = cachedM.get(value);
	if (m !== undefined) {
		return m;
	}

	let c = 0;
	while ((value % 10) === 0) {
		value /= 10;
		c += 2;
	}
	switch (value) {
	case 1: break;
	case 2: c += 10; break;
	case 3: c += 40; break;
	case 4: c += 20; break;
	case 5: c += 10; break;
	case 6: c += 50; break;
	case 7: c += 100; break;
	case 8: c += 40; break;
	case 9: c += 60; break;
	case 11: c += 20; break;
	case 12: c += 50; break;
	default: c += value * 20;
	}
	cachedM.set(value, c);
	return c;
}

function aCanonical(a, b) {
	// prefer ((a+b)+c)+d over (a+b)+(c+d)
	// prefer (a+b)+c over a+(b+c)
	if (b.source.op.chain === 'addition') {
		return false;
	}

	// prefer (a+b)-c over (a-c)+b
	if (a.source.op.id === 'sub') {
		return false;
	}

	// prefer (a+b)+c : a>=b>=c
	if (a.source.op.id === 'add') {
		return a.source.b >= b.value;
	}

	return true;
}

function sCanonical(a, b) {
	// prefer ((a+b)-c)-d over (a+b)-(c+d)
	// prefer (a-b)-c over a-(b+c)
	if (b.source.op.chain === 'addition') {
		return false;
	}

	// prefer (a-b)-c : a>=b>=c
	if (a.source.op.id === 'sub') {
		return a.source.b >= b.value;
	}

	return true;
}

function mCanonical(a, b) {
	// prefer ((a*b)*c)*d over (a*b)*(c*d)
	// prefer (a*b)*c over a*(b*c)
	if (b.source.op.chain === 'multiplication') {
		return false;
	}

	// prefer (a*b)/c over (a/c)*b
	if (a.source.op.id === 'div') {
		return false;
	}

	// prefer (a*b)*c : a>=b>=c
	if (a.source.op.id === 'mul') {
		return a.source.b >= b.value;
	}

	return true;
}

function dCanonical(a, b) {
	// prefer ((a*b)/c)/d over (a*b)/(c*d)
	// prefer ((a*b)*d)/c over (a*b)/(c/d)
	// prefer (a/b)/c over a/(b*c)
	// prefer (a*c)/b over a/(b/c)
	if (b.source.op.chain === 'multiplication') {
		return false;
	}

	return true;
}

const Operators = {
	ADD: {
		id: 'add',
		name: '+',
		supports: (a, b) => (a >= b),
		apply: (a, b) => (a + b),
		difficulty: (a, b) => Math.min(aComplexity(a), aComplexity(b)),
		chain: 'addition',
		allowsCanonicalSources: aCanonical,
	},
	SUBTRACT_POSITIVE: {
		id: 'sub',
		name: '\u2212',
		supports: (a, b) => (a > b),
		apply: (a, b) => (a - b),
		difficulty: (a, b) => (Math.min(aComplexity(a), aComplexity(b)) * 10),
		chain: 'addition',
		allowsCanonicalSources: sCanonical,
	},
	MULTIPLY: {
		id: 'mul',
		name: '\u00D7',
		supports: (a, b) => (a >= b),
		apply: (a, b) => (a * b),
		difficulty: (a, b) => ((mComplexity(a) + mComplexity(b)) * 30),
		chain: 'multiplication',
		allowsCanonicalSources: mCanonical,
	},
	DIVIDE_WHOLE: {
		id: 'div',
		name: '\u00F7',
		supports: (a, b) => (b !== 0 && (a % b) === 0),
		apply: (a, b) => ((a / b)|0),
		difficulty: (a, b) => {
			if (a === b) {
				return 1;
			}
			const ca = mComplexity(a);
			const cb = mComplexity(b);
			const cr = mComplexity((a / b)|0);
			return Math.min(ca + cb, ca + cr * 2, cb + cr * 2) * 100;
		},
		chain: 'multiplication',
		allowsCanonicalSources: dCanonical,
	},
};

const COUNTDOWN_RULES = [
	Operators.ADD,
	Operators.SUBTRACT_POSITIVE,
	Operators.MULTIPLY,
	Operators.DIVIDE_WHOLE,
];
