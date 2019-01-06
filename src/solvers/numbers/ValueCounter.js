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

	has(v) {
		return this.counts.get(v) > 0;
	}

	inc(v) {
		this.counts.set(v, (this.counts.get(v) || 0) + 1);
	}

	dec(v) {
		const c = this.counts.get(v);
		if (c === 1) {
			this.counts.delete(v);
		} else {
			this.counts.set(v, c - 1);
		}
	}

	set(v, n) {
		if (n === 0) {
			this.counts.delete(v);
		} else {
			this.counts.set(v, n);
		}
	}

	pairings(fn) {
		for (const v1 of this.counts.keys()) {
			for (const [v2, n] of this.counts) {
				if (v1 !== v2 || n >= 2) {
					const remaining = this.copy();
					remaining.dec(v1);
					remaining.dec(v2);
					fn(v1, v2, remaining);
				}
			}
		}
	}

	pairingsInplace(fn) {
		// Faster and reduces GC requirements, but must be used carefully
		const vs = Array.from(this.counts.keys());
		for (let i1 = 0; i1 < vs.length; ++ i1) {
			const v1 = vs[i1];
			const n1 = this.counts.get(v1);
			if (n1 >= 2) {
				this.set(v1, n1 - 2);
				fn(v1, v1, this);
			}
			this.set(v1, n1 - 1);
			for (let i2 = 0; i2 < i1; ++ i2) {
				const v2 = vs[i2];
				const n2 = this.counts.get(v2);
				this.set(v2, n2 - 1);
				fn(v1, v2, this);
				fn(v2, v1, this);
				this.counts.set(v2, n2);
			}
			this.counts.set(v1, n1);
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
