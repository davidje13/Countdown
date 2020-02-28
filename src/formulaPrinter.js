'use strict';

import {make, block} from './dom.js';

const ADD = '+';
const SUBTRACT = '\u2212';
const MULTIPLY = '\u00D7';

const ADDITIVE = 'add';
const MULTIPLICATIVE = 'mul';

function typeOf(action) {
	return (action.symbol() === ADD || action.symbol() === SUBTRACT) ? ADDITIVE : MULTIPLICATIVE;
}
function baseOp(type) {
	return (type === ADDITIVE) ? ADD : MULTIPLY;
}

class Chain {
	constructor(action) {
		this.type = typeOf(action);
		this.actions = [
			{ op: baseOp(this.type), v: action.a, sub: null },
			{ op: action.symbol(), v: action.b, sub: null },
		];
		this.result = action.result();
		this.consumed = false;
		this.depth = 0;
	}

	unshift(action) {
		if (this.type === 'mul') {
			if (action.symbol() !== this.actions[1].op) {
				// do not allow mixing multiply and divide
				return false;
			}
		}
		if (action.result() === this.actions[0].v && typeOf(action) === this.type) {
			this.actions.unshift({ op: baseOp(this.type), v: action.a, sub: null });
			this.actions[1] = { op: action.symbol(), v: action.b, sub: null };
			return true;
		}
		return false;
	}
}

function countBranches(chain) {
	return chain.actions.filter((action) => (action.sub !== null)).length;
}

function chainBasicEq(chain, includeFirst = true) {
	let s = includeFirst ? String(chain.actions[0].v) : '';
	for (let i = 1; i < chain.actions.length; ++ i) {
		const action = chain.actions[i];
		s += ` ${action.op} ${action.v}`
	}
	return s;
}

function drawDeepChain(chain, allowVertical, hold, final = '') {
	const branches = countBranches(chain);
	if (!allowVertical || branches === 0) {
		for (const action of chain.actions) {
			if (action.sub) {
				hold.appendChild(drawDeepChain(action.sub, true, hold));
			}
		}

		return block('p', `${chainBasicEq(chain)} = ${chain.result}`);
	}

	if (final === '' && branches === 1 && chain.actions[0].sub) {
		let subBranches = 0;
		for (const action of chain.actions) {
			if (action.sub) {
				subBranches += countBranches(action.sub);
			}
		}
		if (subBranches > 0) {
			const final = `${chainBasicEq(chain, false)} = ${chain.result}`;
			return drawDeepChain(chain.actions[0].sub, true, hold, final);
		}
	}

	const table = make('table');
	const tbody = make('tbody');
	table.appendChild(tbody);

	for (let i = 0; i < chain.actions.length; ++ i) {
		const tr = make('tr');
		const action = chain.actions[i];
		if (action.sub) {
			for (const subAction of action.sub.actions) {
				if (subAction.sub) {
					hold.appendChild(drawDeepChain(subAction.sub, true, hold));
				}
			}

			tr.appendChild(block('td', chainBasicEq(action.sub), { 'class': 'vert-sub-formula' }));
			tr.appendChild(block('td', '=', { 'class': 'num-eq' }));
		} else {
			tr.appendChild(make('td', { colspan: 2 }));
		}
		tr.appendChild(block('td', String(action.v), { 'class': 'num-right' }));
		let op = '';
		if (i + 1 < chain.actions.length) {
			op = chain.actions[i + 1].op;
		}
		tr.appendChild(block('td', op, { 'class': 'vert-op' }));
		tbody.appendChild(tr);
	}

	const tr = make('tr', { 'class': 'result' });
	tr.appendChild(make('td', { colspan: 2 }));
	tr.appendChild(block('td', String(chain.result), { 'class': 'num-right' }));
	tr.appendChild(block('td', final, { 'class': 'final' }));
	tbody.appendChild(tr);

	return table;
}

export function formulaDom(formula) {
	if (formula.actions.length === 0) {
		return block('p', String(formula.result()));
	}

	const chains = [];
	for (let i = formula.actions.length; (i --) > 0; ) {
		const action = formula.actions[i];
		let match = false;
		for (const chain of chains) {
			if (chain.unshift(action)) {
				match = true;
				break;
			}
		}
		if (!match) {
			chains.unshift(new Chain(action));
		}
	}

	const finalChain = chains[chains.length - 1];
	finalChain.consumed = true;

	for (let i = chains.length; (i --) > 0; ) {
		const chain = chains[i];
		for (const action of chain.actions) {
			for (const subChain of chains) {
				if (!subChain.consumed && subChain.result === action.v) {
					subChain.consumed = true;
					action.sub = subChain;
					break;
				}
			}
		}
	}

	const hold = make('div');
	hold.appendChild(drawDeepChain(finalChain, true, hold));
	return hold;
}
