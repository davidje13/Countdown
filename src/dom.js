'use strict';

function make(type, attrs = {}) {
	const o = document.createElement(type);
	for (const attr in attrs) {
		o.setAttribute(attr, attrs[attr]);
	}
	return o;
}
