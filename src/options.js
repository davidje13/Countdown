'use strict';

export const numberOptions = {
	inputCount: 6,
	minTarget: 101,
	maxTarget: 999,
};

export const numberPickerOptions = {
	selectionBig: [100, 75, 50, 25],
	selectionSmall: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
	presets: [
		{name: 'One from the top', selection: ['Bsssss']},
		{name: 'Two big, four small', selection: ['BBssss']},
		{name: 'Three big, three small', selection: ['BBBsss']},
		{name: 'Four big ones', selection: ['BBBBss']},
		{name: 'Six small', selection: ['ssssss']},
	],
};

export const letterOptions = {
	letterCount: 9,
	maxVowels: 5,
	maxConsonants: 6,
	vowels: [
		{ c: 'a', p: 15 },
		{ c: 'e', p: 21 },
		{ c: 'i', p: 13 },
		{ c: 'o', p: 13 },
		{ c: 'u', p: 5 },
	],
	consonants: [
		{ c: 'b', p: 2 },
		{ c: 'c', p: 3 },
		{ c: 'd', p: 6 },
		{ c: 'f', p: 2 },
		{ c: 'g', p: 3 },
		{ c: 'h', p: 2 },
		{ c: 'j', p: 1 },
		{ c: 'k', p: 1 },
		{ c: 'l', p: 5 },
		{ c: 'm', p: 4 },
		{ c: 'n', p: 8 },
		{ c: 'p', p: 4 },
		{ c: 'q', p: 1 },
		{ c: 'r', p: 9 },
		{ c: 's', p: 9 },
		{ c: 't', p: 9 },
		{ c: 'v', p: 1 },
		{ c: 'w', p: 1 },
		{ c: 'x', p: 1 },
		{ c: 'y', p: 1 },
		{ c: 'z', p: 1 },
	],
};
