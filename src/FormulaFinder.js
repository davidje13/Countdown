'use strict';

function findOptions(states, operators, fn) {
	states.forEach((valueData, values) => {
		values.pairings((a, b, remaining) => {
			for (const op of operators) {
				if (op.supports(a, b)) {
					const v = op.apply(a, b);
					fn(remaining.copy().inc(v), valueData, a, b, op, v);
				}
			}
		});
	});
}

function setMinimum(map, key, value) {
	const oldValue = map.get(key);
	if (oldValue === undefined || value < oldValue) {
		map.set(key, value);
	}
}

class FormulaFinder {
	constructor(operators) {
		this.operators = operators;
	}

	findFormulas(inputs, target, {all}) {
		if (all) {
			return this.findAllFormulas(inputs, target);
		} else {
			const solution = this.findAnyFormula(inputs, target);
			return solution ? [solution] : [];
		}
	}

	findAllFormulas(inputs, target) {
		const operators = this.operators;

		if (inputs.includes(target)) {
			return [Formula.fromLastAction(null)];
		}

		const solutions = [];
		let current = new HashMap();
		current.set(ValueCounter.of(inputs), [null]);

		for (let n = 0; n < inputs.length - 1; ++ n) {
			const next = new HashMap();
			findOptions(current, operators, (vals, prevActs, a, b, op, v) => {
				const entry = next.setIfAbsent(vals, []);
				for (const prevAct of prevActs) {
					entry.push(new Formula.Action(a, b, op, prevAct));
				}
				if (v === target) {
					for (const act of entry.slice(-prevActs.length)) {
						const formula = Formula.fromLastAction(act);
						if (formula._isMinimal(inputs)) {
							solutions.push(formula);
						}
					}
				}
			});
			current = next;
		}

		return solutions;
	}

	findAnyFormula(inputs, target) {
		const operators = this.operators;

		if (inputs.includes(target)) {
			return Formula.fromLastAction(null);
		}

		let current = new HashMap();
		current.set(ValueCounter.of(inputs), null);

		for (let n = 0; n < inputs.length - 1; ++ n) {
			const next = new HashMap();
			const solutions = [];
			findOptions(current, operators, (vals, prevAct, a, b, op, v) => {
				const act = new Formula.Action(a, b, op, prevAct);
				next.setIfAbsent(vals, act);
				if (v === target) {
					solutions.push(Formula.fromLastAction(act));
				}
			});
			current = next;
			if (solutions.length > 0) {
				return solutions[0];
			}
		}

		return null;
	}

	findTargets(inputs, {min = 1, max = Number.POSITIVE_INFINITY} = {}) {
		const operators = this.operators;

		const targets = new Map();
		for (const v of inputs) {
			if (v >= min && v <= max) {
				targets.set(v, 0);
			}
		}

		let current = new HashMap();
		current.set(ValueCounter.of(inputs), 0);

		for (let n = 0; n < inputs.length - 1; ++ n) {
			const next = new HashMap();
			findOptions(current, operators, (vals, prevDiff, a, b, op, v) => {
				const d = prevDiff + op.difficulty(a, b);
				setMinimum(next, vals, d);
				if (v >= min && v <= max) {
					setMinimum(targets, v, d);
				}
			});
			current = next;
		}

		const allTargets = [];
		for (const [value, difficulty] of targets) {
			allTargets.push({value, difficulty});
		}
		return allTargets;
	}

	analyse(games, {min = 1, max = Number.POSITIVE_INFINITY} = {}) {
		return games.map((inputs) => {
			const targets = this.findTargets(inputs, {min, max});
			targets.sort((a, b) => (a.difficulty - b.difficulty));
			let sumDifficulty = 0;
			for (const target of targets) {
				sumDifficulty += target.difficulty;
			}

			return {
				inputs,
				achievable: targets.length,
				easiest: targets[0] || null,
				hardest: targets[targets.length - 1] || null,
				averageDifficulty: sumDifficulty / targets.length,
			};
		});
	}
}
