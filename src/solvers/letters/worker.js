'use strict';

importScripts(
	'./WordFinder.js',
	'./generated-data.js'
);

const initTm0 = Date.now();
const finder = new WordFinder(words);
const initTm1 = Date.now();

self.addEventListener('message', ({data}) => {
	const response = {};
	const tm0 = Date.now();

	switch (data.type) {
	case 'SOLVE_EXACT':
		response.solutions = finder.findExact(data.letters);
		break;
	case 'SOLVE':
		response.solutions = finder.findWords(data.letters);
		break;
	case 'CALCULATE':
		Object.assign(response, finder.calculateExpected(data.options));
		break;
	}

	const tm1 = Date.now();
	response.time = tm1 - tm0;
	response.initTime = initTm1 - initTm0;
	self.postMessage(response);
});
