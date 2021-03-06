'use strict';

class HashMap {
	constructor() {
		this.hashes = new Map();
	}

	set(k, v) {
		const hash = k.hashCode();
		let l = this.hashes.get(hash);
		if (l) {
			for (const i of l) {
				if (k.equals(i.k)) {
					const old = i.v;
					i.v = v;
					return old;
				}
			}
		} else {
			this.hashes.set(hash, l = []);
		}
		l.push({k: k.copy(), v});
		return undefined;
	}

	setIfAbsent(k, v) {
		const hash = k.hashCode();
		let l = this.hashes.get(hash);
		if (l) {
			for (const i of l) {
				if (k.equals(i.k)) {
					return i.v;
				}
			}
		} else {
			this.hashes.set(hash, l = []);
		}
		l.push({k: k.copy(), v});
		return v;
	}

	compute(k, fn) {
		const hash = k.hashCode();
		let l = this.hashes.get(hash);
		if (l) {
			for (const i of l) {
				if (k.equals(i.k)) {
					i.v = fn(i.v);
					return;
				}
			}
		} else {
			this.hashes.set(hash, l = []);
		}
		l.push({k: k.copy(), v: fn(undefined)});
	}

	get(k) {
		const l = this.hashes.get(k.hashCode());
		if (l) {
			for (const i of l) {
				if (k.equals(i.k)) {
					return i.v;
				}
			}
		}
		return undefined;
	}

	forEach(fn) {
		this.hashes.forEach((l) => l.forEach(({k, v}) => fn(v, k)));
	}
}
