'use strict';

class ValueCounter {
	static of(values) {
		const counts = new Map();
		for (const value of values) {
			const v = Math.round(value);
			counts.set(v, (counts.get(v) || 0) + 1);
		}
		return new ValueCounter(counts);
	}

	constructor(counts) {
		this.counts = counts;
	}

	copy() {
		return new ValueCounter(new Map(this.counts));
	}

	inc(v) {
		this.counts.set(v, (this.counts.get(v) || 0) + 1);
		return this;
	}

	dec(v) {
		const c = this.counts.get(v);
		if (c === 1) {
			this.counts.delete(v);
		} else {
			this.counts.set(v, c - 1);
		}
		return this;
	}

	pairings(fn) {
		for (const v1 of this.counts.keys()) {
			for (const [v2, n] of this.counts) {
				if (v1 !== v2 || n >= 2) {
					fn(v1, v2, this.copy().dec(v1).dec(v2));
				}
			}
		}
	}

	hashCode() {
		let hash = 0;
		for (const [k, v] of this.counts) {
			hash += k * k * (k * 23 + v);
		}
		return hash;
	}

	equals(b) {
		if (this.counts.size !== b.counts.size) {
			return false;
		}
		for (const [k, v] of this.counts) {
			if (b.counts.get(k) !== v) {
				return false;
			}
		}
		return true;
	}
}
