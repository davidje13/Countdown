'use strict';

const VOID_ACTION = { a: 0, b: 0, op: { name: '', chain: '' } };

class Action {
	constructor(a, b, op, prev = null) {
		this.a = a;
		this.b = b;
		this.op = op;
		this.prev = prev;
	}

	toJSON() {
		return {
			a: this.a,
			b: this.b,
			op: this.op.name,
			r: this.result(),
		};
	}

	result() {
		return this.op.apply(this.a, this.b);
	}

	difficulty() {
		return this.op.difficulty(this.a, this.b);
	}

	toString() {
		return (
			this.a +
			' ' +
			this.op.name +
			' ' +
			this.b +
			' = ' +
			this.result()
		);
	}
}

class FlatAction {
	static fromJSON({a, b, op, r}) {
		return new FlatAction(a, b, op, r);
	}

	constructor(a, b, op, r) {
		this.a = a;
		this.b = b;
		this.op = op;
		this.r = r;
	}

	result() {
		return this.r;
	}

	toString() {
		return (
			this.a +
			' ' +
			this.op +
			' ' +
			this.b +
			' = ' +
			this.r
		);
	}
}

function buildFormulasRecur(formulas, curAction, actions, difficulty) {
	if (curAction === null) {
		const ordered = actions.slice();
		ordered.reverse();
		formulas.push(new Formula(ordered, difficulty));
		return;
	}
	difficulty += curAction.difficulty();
	actions.push(curAction);
	for (const action of curAction.prev) {
		buildFormulasRecur(formulas, action, actions, difficulty);
	}
	actions.pop();
}

function hasUnnecessarySteps(actions, inputs) {
	const steps = actions.map((action) => ({
		a: action.a,
		b: action.b,
		result: action.result(),
	}));
	const required = [steps[steps.length - 1].result];
	const remainingInputs = inputs.slice();

	while (required.length > 0) {
		const target = required.pop();
		if (remainingInputs.includes(target)) {
			remainingInputs.splice(remainingInputs.indexOf(target), 1);
			continue;
		}
		for (let i = 0; i < steps.length; ++ i) {
			const step = steps[i];
			if (step.result === target) {
				required.push(step.a);
				required.push(step.b);
				steps.splice(i, 1);
				break;
			}
		}
	}

	return steps.length > 0;
}

function findCanonicalSources(action, values) {
	const optionsA = values.filter(({ value }) => (value === action.a));
	const optionsB = values.filter(({ value }) => (value === action.b));
	for (const a of optionsA) {
		for (const b of optionsB) {
			if (a !== b && action.op.allowsCanonicalSources(a, b)) {
				return { a, b };
			}
		}
	}
	return null;
}

function hasNoncanonicalOrdering(actions, inputs) {
	const values = inputs.map((value) => ({ source: VOID_ACTION, value }));

	const remainingActions = actions.slice();
	for (let n = remainingActions.length; (n --) > 0; ) {
		for (let i = 0; i < remainingActions.length; ++ i) {
			const action = remainingActions[i];
			const opt = findCanonicalSources(action, values);
			if (opt) {
				values.splice(values.indexOf(opt.a), 1);
				values.splice(values.indexOf(opt.b), 1);
				values.push({ source: action, value: action.result() });
				remainingActions.splice(i, 1);
				break;
			}
		}
	}

	return remainingActions.length > 0;
}

class Formula {
	static fromLastAction(lastAction) {
		const actions = [];
		let d = 0;
		for (let action = lastAction; action !== null; action = action.prev) {
			actions.push(action);
			d += action.difficulty();
		}
		actions.reverse();
		return new Formula(actions, d);
	}

	static fromLastActionTree(lastAction) {
		const formulas = [];
		const actions = [];
		buildFormulasRecur(formulas, lastAction, actions, 0);
		return formulas;
	}

	static fromJSON({actions, difficulty}) {
		return new Formula(
			actions.map(FlatAction.fromJSON),
			difficulty
		);
	}

	constructor(actions = [], difficulty = 0) {
		this.actions = actions;
		this.difficulty = difficulty;
		this.length = actions.length;
	}

	result() {
		return this.actions[this.actions.length - 1].result();
	}

	_isMinimal(inputs) {
		if (this.actions.length === 0) {
			return true;
		}

		if (hasUnnecessarySteps(this.actions, inputs)) {
			return false;
		}

		if (hasNoncanonicalOrdering(this.actions, inputs)) {
			return false;
		}

		return true;
	}

	toJSON() {
		return {
			actions: this.actions.map((action) => action.toJSON()),
			difficulty: this.difficulty,
		};
	}

	toString() {
		if (this.actions.length === 0) {
			return '(no actions)\n';
		}
		let s = '';
		for (const action of this.actions) {
			s += action.toString() + '\n';
		}
		return s;
	}
}

Formula.Action = Action;
