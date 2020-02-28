'use strict';

importScripts(
	'./WordFinder.js',
	'./generated-data-common.js',
	'./generated-data-standard.js',
	'./generated-data-rare.js'
);

const initTm0 = Date.now();
const finder = new WordFinder([
	...commonWords.map((word) => ({ word, freq: 3 })),
	...standardWords.map((word) => ({ word, freq: 2 })),
	...rareWords.map((word) => ({ word, freq: 1 })),
]);
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
	case 'PICK_BEST':
		Object.assign(response, finder.pickBestGroup(data.letters, data.groups, data.count));
		break;
	}

	const tm1 = Date.now();
	response.time = tm1 - tm0;
	response.initTime = initTm1 - initTm0;
	self.postMessage(response);
});
