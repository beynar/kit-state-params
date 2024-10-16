import { parseURL } from '$lib/utils.js';
import type { Schema } from '../src/lib/types.js';
import { describe, it, expect } from 'vitest';

describe('parseURL', () => {
	it('should parse and handle missing values in paths', () => {
		const schema = {
			string: 'string',
			number: 'number',
			array: ['string'],
			nested: {
				boolean: 'boolean',
				date: 'date'
			}
		} satisfies Schema;

		const paths: [string, string][] = [
			['string', 'hello'],
			['array', '[array]'],
			['nested.boolean', 'true']
		];
		const url = new URL('https://example.com');
		paths.forEach(([key, value]) => url.searchParams.set(key, value));
		const result = parseURL(url, schema);

		expect(result).toEqual({
			string: 'hello',
			number: null,
			array: [],
			nested: {
				boolean: true,
				date: null
			}
		});
	});

	it('should parse nested objects and arrays correctly', () => {
		const schema = {
			user: {
				name: 'string',
				age: 'number',
				hobbies: ['string'],
				address: {
					street: 'string',
					city: 'string',
					zipCode: 'number'
				}
			},
			preferences: {
				theme: 'string',
				notifications: 'boolean'
			}
		} satisfies Schema;

		const url = new URL('https://example.com');
		url.searchParams.set('user.name', 'John Doe');
		url.searchParams.set('user.age', '30');
		url.searchParams.set('user.hobbies.0', 'reading');
		url.searchParams.set('user.hobbies.1', 'cycling');
		url.searchParams.set('user.address.street', '123 Main St');
		url.searchParams.set('user.address.city', 'New York');
		url.searchParams.set('user.address.zipCode', '10001');
		url.searchParams.set('preferences.theme', 'dark');
		url.searchParams.set('preferences.notifications', 'true');

		const result = parseURL(url, schema);

		expect(result).toEqual({
			user: {
				name: 'John Doe',
				age: 30,
				hobbies: ['reading', 'cycling'],
				address: {
					street: '123 Main St',
					city: 'New York',
					zipCode: 10001
				}
			},
			preferences: {
				theme: 'dark',
				notifications: true
			}
		});
	});

	it('should handle different primitive types correctly', () => {
		const schema = {
			string: 'string',
			number: 'number',
			boolean: 'boolean',
			date: 'date'
		} satisfies Schema;

		const url = new URL('https://example.com');
		url.searchParams.set('string', 'hello');
		url.searchParams.set('number', '42');
		url.searchParams.set('boolean', 'true');
		url.searchParams.set('date', '2023-04-15T12:00:00Z');

		const result = parseURL(url, schema);

		expect(result).toEqual({
			string: 'hello',
			number: 42,
			boolean: true,
			date: new Date('2023-04-15T12:00:00Z')
		});
	});

	it('should handle empty and invalid values correctly', () => {
		const schema = {
			emptyString: 'string',
			invalidNumber: 'number',
			invalidBoolean: 'boolean',
			invalidDate: 'date'
		} satisfies Schema;

		const url = new URL('https://example.com');
		url.searchParams.set('emptyString', '');
		url.searchParams.set('invalidNumber', 'not-a-number');
		url.searchParams.set('invalidBoolean', 'maybe');
		url.searchParams.set('invalidDate', 'not-a-date');

		const result = parseURL(url, schema);

		expect(result).toEqual({
			emptyString: null,
			invalidNumber: null,
			invalidBoolean: null,
			invalidDate: null
		});
	});

	it('should handle arrays with nested objects', () => {
		const schema = {
			users: [
				{
					name: 'string',
					age: 'number'
				}
			]
		} satisfies Schema;

		const url = new URL('https://example.com');
		url.searchParams.set('users.0.name', 'Alice');
		url.searchParams.set('users.0.age', '25');
		url.searchParams.set('users.1.name', 'Bob');
		url.searchParams.set('users.1.age', '30');

		const result = parseURL(url, schema);

		expect(result).toEqual({
			users: [
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 }
			]
		});
	});
});
