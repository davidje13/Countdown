'use strict';

function findOptions(states, operators, fn) {
	states.forEach((valueData, values) => {
		values.pairingsInplace((a, b, remaining) => {
			for (const op of operators) {
				if (op.supports(a, b)) {
					const v = op.apply(a, b);
					remaining.inc(v);
					fn(remaining, valueData, a, b, op, v);
					remaining.dec(v);
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

	findAllFormulas(inputs, target) {
		return this.findAllNearest(inputs, target, { maxDist: 0 });
	}

	findAllNearest(inputs, target, {
		rangeMin = 1,
		rangeMax = Number.POSITIVE_INFINITY,
		maxDist = Number.POSITIVE_INFINITY,
	} = {}) {
		const operators = this.operators;

		if (inputs.includes(target)) {
			return [new Formula()];
		}

		const finalActions = [];
		let bestDist = maxDist + 1;
		let current = new HashMap();
		current.set(ValueCounter.of(inputs), [null]);

		for (let n = 0; n < inputs.length - 1; ++ n) {
			const next = new HashMap();
			findOptions(current, operators, (vals, prevAct, a, b, op, v) => {
				const action = new Formula.Action(a, b, op, prevAct);

				next.setIfAbsent(vals, []).push(action);

				if (v >= rangeMin && v <= rangeMax) {
					const dist = Math.abs(v - target);
					if (dist < bestDist) {
						bestDist = dist;
						finalActions.length = 0;
					}
					if (dist === bestDist) {
						finalActions.push(action);
					}
				}
			});
			current = next;
		}

		if (bestDist > maxDist) {
			return [];
		}
		const filtered = [];
		finalActions.forEach((action) => filtered.push(...Formula
			.fromLastActionTree(action)
			.filter((formula) => formula._isMinimal(inputs))
		));
		if (filtered.length === 0) {
			// should never happen, but throw if it does to identify bugs
			throw new Error('Internal error: filtering removed all solutions');
		}
		return filtered;
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
				next.compute(
					vals,
					(old) => ((old === undefined || d < old) ? d : old)
				);
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
