'use strict';

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

class Formula {
	static fromLastAction(lastAction) {
		const actions = [];
		let d = 0;
		for (let action = lastAction; action !== null; action = action.prev) {
			actions.unshift(action);
			d += action.difficulty();
		}
		return new Formula(actions, d);
	}

	static fromJSON({actions, difficulty}) {
		return new Formula(
			actions.map(FlatAction.fromJSON),
			difficulty
		);
	}

	constructor(actions, difficulty) {
		this.actions = actions;
		this.difficulty = difficulty;
		this.length = actions.length;
	}

	_isMinimal(inputs) {
		if (this.actions.length === 0) {
			return true;
		}

		const steps = this.actions.map((action) => ({
			a: action.a,
			b: action.b,
			result: action.result(),
		}));
		const required = [steps[steps.length - 1].result];
		const inputValues = ValueCounter.of(inputs);

		while (required.length > 0) {
			const target = required.pop();
			if (inputValues.has(target)) {
				inputValues.dec(target);
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

		return steps.length === 0;
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
