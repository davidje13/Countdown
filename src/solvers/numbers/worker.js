'use strict';

importScripts(
	'./HashMap.js',
	'./ValueCounter.js',
	'./Operators.js',
	'./Formula.js',
	'./FormulaFinder.js'
);

const finder = new FormulaFinder(COUNTDOWN_RULES);

self.addEventListener('message', ({data}) => {
	const response = {};
	const tm0 = Date.now();

	switch (data.type) {
	case 'TARGETS':
		response.targets = finder.findTargets(data.inputs, data.options);
		break;
	case 'SOLVE':
		response.solutions = finder
			.findAllNearest(data.inputs, data.target, data.options)
			.map((solution) => solution.toJSON());
		break;
	case 'ANALYSE':
		response.analysis = finder.analyse(data.games, data.options);
		break;
	}

	const tm1 = Date.now();
	response.time = tm1 - tm0;
	self.postMessage(response);
});
