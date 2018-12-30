'use strict';

function aComplexity(value) {
	let c = 0;
	while ((value % 10) === 0) {
		value /= 10;
		++ c;
	}
	return c + value * 10;
}

function mComplexity(value) {
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
	return c;
}

const Operators = {
	ADD: {
		name: '+',
		supports: (a, b) => (a >= b),
		apply: (a, b) => (a + b),
		difficulty: (a, b) => Math.min(aComplexity(a), aComplexity(b)),
	},
	SUBTRACT_POSITIVE: {
		name: '-',
		supports: (a, b) => (a > b),
		apply: (a, b) => (a - b),
		difficulty: (a, b) => (Math.min(aComplexity(a), aComplexity(b)) * 10),
	},
	MULTIPLY: {
		name: '*',
		supports: (a, b) => (a >= b),
		apply: (a, b) => (a * b),
		difficulty: (a, b) => ((mComplexity(a) + mComplexity(b)) * 30),
	},
	DIVIDE_WHOLE: {
		name: '/',
		supports: (a, b) => (b !== 0 && (a % b) === 0),
		apply: (a, b) => ((a / b)|0),
		difficulty: (a, b) => (Math.min(
			mComplexity(a) + mComplexity(b),
			Math.min(mComplexity(a), mComplexity(b)) + mComplexity((a / b)|0) * 2
		) * 100),
	},
};

const COUNTDOWN_RULES = [
	Operators.ADD,
	Operators.SUBTRACT_POSITIVE,
	Operators.MULTIPLY,
	Operators.DIVIDE_WHOLE,
];
