'use strict';

export function textnode(text) {
	return document.createTextNode(text);
};

export function make(type, attrs = {}) {
	const o = document.createElement(type);
	for (const attr in attrs) {
		o.setAttribute(attr, attrs[attr]);
	}
	return o;
};

export function block(tag, text, attrs) {
	const p = make(tag, attrs);
	p.textContent = text;
	return p;
}

export function paragraph(text) {
	return block('p', text);
}
