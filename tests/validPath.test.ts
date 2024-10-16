import type { Schema } from '$lib/types.js';
import { isValidPath } from '$lib/utils.js';
import { describe, expect, it } from 'vitest';

const schema: Schema = {
	string: 'string',
	number: 'number',
	boolean: 'boolean',
	date: 'date',
	array: ['string'],
	nestedObject: {
		foo: 'string',
		bar: 'number'
	},
	arrayOfObjects: [
		{
			id: 'number',
			name: 'string'
		}
	]
};

it('should return true for valid primitive paths', () => {
	expect(isValidPath('string', schema)).toBe(true);
	expect(isValidPath('number', schema)).toBe(true);
	expect(isValidPath('boolean', schema)).toBe(true);
	expect(isValidPath('date', schema)).toBe(true);
});

it('should return true for valid array paths', () => {
	expect(isValidPath('array', schema)).toBe(true);
	expect(isValidPath('array.0', schema)).toBe(true);
	expect(isValidPath('array.1', schema)).toBe(true);
	expect(isValidPath('array.10', schema)).toBe(true);
});

it('should return true for valid nested object paths', () => {
	expect(isValidPath('nestedObject', schema)).toBe(true);
	expect(isValidPath('nestedObject.foo', schema)).toBe(true);
	expect(isValidPath('nestedObject.bar', schema)).toBe(true);
});

it('should return true for valid array of objects paths', () => {
	expect(isValidPath('arrayOfObjects', schema)).toBe(true);
	expect(isValidPath('arrayOfObjects.0', schema)).toBe(true);
	expect(isValidPath('arrayOfObjects.0.id', schema)).toBe(true);
	expect(isValidPath('arrayOfObjects.0.name', schema)).toBe(true);
	expect(isValidPath('arrayOfObjects.1.id', schema)).toBe(true);
	expect(isValidPath('arrayOfObjects.100.name', schema)).toBe(true);
});

it('should return false for invalid paths', () => {
	expect(isValidPath('nonexistent', schema)).toBe(false);
	expect(isValidPath('string.invalid', schema)).toBe(false);
	expect(isValidPath('array.invalid', schema)).toBe(false);
	expect(isValidPath('nestedObject.nonexistent', schema)).toBe(false);
	expect(isValidPath('arrayOfObjects.0.nonexistent', schema)).toBe(false);
	expect(isValidPath('arrayOfObjects.invalid.id', schema)).toBe(false);
});
