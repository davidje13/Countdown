'use strict';

class Action {
	constructor(a, b, op, prev = null) {
		this.a = a;
		this.b = b;
		this.op = op;
		this.prev = prev;
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

class Formula {
	static fromLastAction(lastAction) {
		const actions = [];
		for (let action = lastAction; action !== null; action = action.prev) {
			actions.unshift(action);
		}
		return new Formula(actions);
	}

	constructor(actions) {
		this.actions = actions;
		this.cachedDifficulty = -1;
	}

	difficulty() {
		if (this.cachedDifficulty === -1) {
			let d = 0;
			for (const action of this.actions) {
				d += action.difficulty();
			}
			this.cachedDifficulty = d;
		}
		return this.cachedDifficulty;
	}

	length() {
		return this.actions.length;
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
