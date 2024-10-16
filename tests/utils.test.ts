import { describe, it, expect, vi } from 'vitest';
import { debounce, stringifyPrimitive, parsePrimitive, parseURL } from '../src/lib/utils.js';
import type { Schema } from '../src/lib/types.js';

describe('debounce', () => {
	it('should delay function execution', async () => {
		vi.useFakeTimers();
		const mockFn = vi.fn();
		const debouncedFn = debounce(mockFn, 100);

		debouncedFn();
		expect(mockFn).not.toBeCalled();

		vi.advanceTimersByTime(50);
		debouncedFn();
		expect(mockFn).not.toBeCalled();

		vi.advanceTimersByTime(100);
		expect(mockFn).toBeCalledTimes(1);

		vi.useRealTimers();
	});

	it('should only execute the last call in a series of rapid calls', () => {
		vi.useFakeTimers();
		const mockFn = vi.fn();
		const debouncedFn = debounce(mockFn, 100);

		for (let i = 0; i < 5; i++) {
			debouncedFn();
		}

		vi.advanceTimersByTime(150);
		expect(mockFn).toBeCalledTimes(1);

		vi.useRealTimers();
	});

	it('should work with different delay values', () => {
		vi.useFakeTimers();
		const mockFn = vi.fn();
		const debouncedFn1 = debounce(mockFn, 50);
		const debouncedFn2 = debounce(mockFn, 200);

		debouncedFn1();
		debouncedFn2();

		vi.advanceTimersByTime(100);
		expect(mockFn).toBeCalledTimes(1);

		vi.advanceTimersByTime(150);
		expect(mockFn).toBeCalledTimes(2);

		vi.useRealTimers();
	});
});

describe('stringify', () => {
	it('should stringify string values', () => {
		expect(stringifyPrimitive('string', 'hello')).toBe('hello');
		expect(stringifyPrimitive('string', null)).toBe(null);
	});

	it('should stringify number values', () => {
		expect(stringifyPrimitive('number', 42)).toBe('42');
		expect(stringifyPrimitive('number', 0)).toBe('0');
		expect(stringifyPrimitive('number', null)).toBe(null);
	});

	it('should stringify date values', () => {
		const date = new Date('2023-04-01T12:00:00Z');
		expect(stringifyPrimitive('date', date)).toBe('2023-04-01T12:00:00.000Z');
		expect(stringifyPrimitive('date', null)).toBe(null);
	});

	it('should stringify boolean values', () => {
		expect(stringifyPrimitive('boolean', true)).toBe('true');
		expect(stringifyPrimitive('boolean', false)).toBe('false');
		expect(stringifyPrimitive('boolean', null)).toBe(null);
	});

	it('should handle edge cases for number type', () => {
		expect(stringifyPrimitive('number', NaN)).toBe(null);
		expect(stringifyPrimitive('number', Infinity)).toBe('Infinity');
		expect(stringifyPrimitive('number', -Infinity)).toBe('-Infinity');
	});

	it('should handle invalid Date objects', () => {
		expect(stringifyPrimitive('date', new Date('invalid'))).toBe(null);
	});

	it('should handle very large numbers', () => {
		expect(stringifyPrimitive('number', 1e20)).toBe('100000000000000000000');
	});

	it('should handle special characters in strings', () => {
		expect(stringifyPrimitive('string', 'Hello, 世界!')).toBe('Hello, 世界!');
	});

	it('should handle empty string', () => {
		expect(stringifyPrimitive('string', '')).toBe('');
	});

	it('should handle zero as a valid number', () => {
		expect(stringifyPrimitive('number', 0)).toBe('0');
	});

	it('should handle boolean edge cases', () => {
		expect(stringifyPrimitive('boolean', 1)).toBe('true');
		expect(stringifyPrimitive('boolean', 0)).toBe('false');
		expect(stringifyPrimitive('boolean', '')).toBe('false');
	});

	it('should handle null values for all types', () => {
		expect(stringifyPrimitive('string', null)).toBe(null);
		expect(stringifyPrimitive('number', null)).toBe(null);
		expect(stringifyPrimitive('date', null)).toBe(null);
		expect(stringifyPrimitive('boolean', null)).toBe(null);
	});
});

describe('parsePrimitive', () => {
	it('should parse string values', () => {
		expect(parsePrimitive('string', 'hello')).toBe('hello');
		expect(parsePrimitive('string', '')).toBe(null);
	});

	it('should parse number values', () => {
		expect(parsePrimitive('number', '42')).toBe(42);
		expect(parsePrimitive('number', '0')).toBe(0);
		expect(parsePrimitive('number', '')).toBe(null);
		expect(parsePrimitive('number', 'not a number')).toBe(null);
	});

	it('should parse date values', () => {
		expect(parsePrimitive('date', '2023-04-01T12:00:00Z')).toEqual(
			new Date('2023-04-01T12:00:00Z')
		);
		expect(parsePrimitive('date', '')).toBe(null);
		expect(parsePrimitive('date', 'invalid date')).toBe(null);
	});

	it('should parse boolean values', () => {
		expect(parsePrimitive('boolean', 'true')).toBe(true);
		expect(parsePrimitive('boolean', 'false')).toBe(false);
		expect(parsePrimitive('boolean', '')).toBe(null);
		expect(parsePrimitive('boolean', 'invalid')).toBe(null);
	});

	it('should parse floating-point numbers', () => {
		expect(parsePrimitive('number', '3.14')).toBe(3.14);
		expect(parsePrimitive('number', '-0.01')).toBe(-0.01);
		expect(parsePrimitive('number', '0.0')).toBe(0);
		expect(parsePrimitive('number', '1e-10')).toBe(1e-10);
	});

	it('should handle whitespace-only strings', () => {
		expect(parsePrimitive('string', '   ')).toBe('   ');
	});

	it('should handle extremely large or small numbers', () => {
		expect(parsePrimitive('number', '1e20')).toBe(1e20);
		expect(parsePrimitive('number', '1e-20')).toBe(1e-20);
		expect(parsePrimitive('number', '9007199254740991')).toBe(9007199254740991); // MAX_SAFE_INTEGER
		expect(parsePrimitive('number', '9007199254740992')).toBe(9007199254740992); // MAX_SAFE_INTEGER + 1
	});

	it('should parse different date formats', () => {
		expect(parsePrimitive('date', '2023-04-01')).toEqual(new Date('2023-04-01'));
		expect(parsePrimitive('date', 'Sat, 01 Apr 2023 12:00:00 GMT')).toEqual(
			new Date('2023-04-01T12:00:00.000Z')
		);
	});

	it('should handle boolean-like strings', () => {
		expect(parsePrimitive('boolean', 'TRUE')).toBe(true);
		expect(parsePrimitive('boolean', 'FALSE')).toBe(false);
		expect(parsePrimitive('boolean', '1')).toBe(null);
		expect(parsePrimitive('boolean', '0')).toBe(null);
	});

	it('should handle special number cases', () => {
		expect(parsePrimitive('number', 'Infinity')).toBe(Infinity);
		expect(parsePrimitive('number', '-Infinity')).toBe(-Infinity);
		expect(parsePrimitive('number', 'NaN')).toBe(null);
	});

	it('should handle date edge cases', () => {
		expect(parsePrimitive('date', '0')).toEqual(new Date(0));
		expect(parsePrimitive('date', '1970-01-01T00:00:00Z')).toEqual(new Date(0));
	});

	it('should handle null value for all types', () => {
		expect(parsePrimitive('string', null)).toBe(null);
		expect(parsePrimitive('number', null)).toBe(null);
		expect(parsePrimitive('date', null)).toBe(null);
		expect(parsePrimitive('boolean', 'null')).toBe(null);
		expect(parsePrimitive('string', 'null')).toBe(null);
		expect(parsePrimitive('number', 'null')).toBe(null);
		expect(parsePrimitive('date', 'null')).toBe(null);
		expect(parsePrimitive('boolean', 'null')).toBe(null);
	});
});

describe('parseURL', () => {
	const schema: Schema = {
		id: 'number',
		name: 'string',
		active: 'boolean',
		created: 'date',
		tags: ['string']
	};

	it('should parse URL string', () => {
		const searchParams = new URLSearchParams({
			id: '42',
			name: 'John',
			active: 'true',
			created: '2023-04-01T12:00:00Z',
			'tags.0': 'tag1',
			'tags.1': 'tag2'
		});
		const result = parseURL(searchParams, schema);
		console.dir(result, { depth: null });
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: true,
			created: new Date('2023-04-01T12:00:00Z'),
			tags: ['tag1', 'tag2']
		});
	});

	it('should parse URL object', () => {
		const url = new URL(
			'https://example.com?id=42&name=John&active=true&created=2023-04-01T12:00:00Z&tags.0=tag1&tags.1=tag2'
		);
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: true,
			created: new Date('2023-04-01T12:00:00Z'),
			tags: ['tag1', 'tag2']
		});
	});

	it('should handle missing parameters', () => {
		const searchParams = new URLSearchParams({
			id: '42',
			name: 'John'
		});
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: null,
			created: null,
			tags: []
		});
	});

	it('should handle invalid values', () => {
		const searchParams = new URLSearchParams({
			id: 'invalid',
			active: 'maybe',
			created: 'not-a-date',
			tags: 'not-an-array'
		});
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: null,
			name: null,
			active: null,
			created: null,
			tags: []
		});
	});

	it('should handle URL-encoded characters', () => {
		const schema: Schema = { name: 'string' };
		const searchParams = new URLSearchParams({ name: 'John Doe' });
		expect(parseURL(searchParams, schema)).toEqual({ name: 'John Doe' });
	});

	it('should handle duplicate parameters', () => {
		const schema: Schema = { tags: ['string'] };
		const searchParams = new URLSearchParams();
		searchParams.append('tags.0', 'tag1');
		searchParams.append('tags.0', 'tag2');
		expect(parseURL(searchParams, schema)).toEqual({ tags: ['tag2'] }); // It uses the first occurrence
	});

	it('should handle a complex nested schema', () => {
		const complexSchema: Schema = {
			id: 'number',
			user: 'string',
			preferences: ['string'],
			lastLogin: 'date'
		};
		const searchParams = new URLSearchParams({
			id: '123',
			user: 'john',
			'preferences.0': 'dark',
			'preferences.1': 'compact',
			lastLogin: '2023-04-01T12:00:00Z'
		});
		const result = parseURL(searchParams, complexSchema);
		expect(result).toEqual({
			id: 123,
			user: 'john',
			preferences: ['dark', 'compact'],
			lastLogin: new Date('2023-04-01T12:00:00Z')
		});
	});

	it('should handle very long URLs', () => {
		const longSchema: Schema = { longParam: 'string' };
		const longValue = 'a'.repeat(2000);
		const searchParams = new URLSearchParams({ longParam: longValue });
		const result = parseURL(searchParams, longSchema);
		expect(result.longParam).toBe(longValue);
	});

	it('should handle all parameters being invalid or empty', () => {
		const schema: Schema = {
			id: 'number',
			name: 'string',
			active: 'boolean',
			created: 'date',
			tags: ['string']
		};
		const searchParams = new URLSearchParams({
			id: '',
			name: '',
			active: '',
			created: '',
			tags: ''
		});
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: null,
			name: null,
			active: null,
			created: null,
			tags: []
		});
	});

	it('should handle URLs with hash fragments', () => {
		const url = new URL('https://example.com?id=42&name=John#section1');
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: null,
			created: null,
			tags: []
		});
	});

	it('should handle URLs with query parameters in unusual order', () => {
		const searchParams = new URLSearchParams({
			active: 'true',
			id: '42',
			name: 'John',
			created: '2023-04-01T12:00:00Z',
			'tags.0': 'tag1',
			'tags.1': 'tag2'
		});
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: true,
			created: new Date('2023-04-01T12:00:00Z'),
			tags: ['tag1', 'tag2']
		});
	});

	it('should handle URLs with repeated parameters', () => {
		const searchParams = new URLSearchParams();
		searchParams.append('id', '42');
		searchParams.append('id', '43');
		searchParams.append('name', 'John');
		searchParams.append('name', 'Jane');
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: 43,
			name: 'Jane',
			active: null,
			created: null,
			tags: []
		});
	});

	it('should handle null values in URL parameters', () => {
		const searchParams = new URLSearchParams({
			id: 'null',
			name: 'null',
			active: 'null',
			created: 'null',
			tags: 'null'
		});
		const result = parseURL(searchParams, schema);
		expect(result).toEqual({
			id: null,
			name: null,
			active: null,
			created: null,
			tags: []
		});
	});
});
