import { describe, it, expect, vi } from 'vitest';
import { debounce, stringify, stringifyArray, parse, parseURL } from '../src/lib/utils.js';
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
		expect(stringify('string', 'hello')).toBe('hello');
		expect(stringify('string', null)).toBe(null);
	});

	it('should stringify number values', () => {
		expect(stringify('number', 42)).toBe('42');
		expect(stringify('number', 0)).toBe('0');
		expect(stringify('number', null)).toBe(null);
	});

	it('should stringify date values', () => {
		const date = new Date('2023-04-01T12:00:00Z');
		expect(stringify('date', date)).toBe('2023-04-01T12:00:00.000Z');
		expect(stringify('date', null)).toBe(null);
	});

	it('should stringify boolean values', () => {
		expect(stringify('boolean', true)).toBe('true');
		expect(stringify('boolean', false)).toBe('false');
		expect(stringify('boolean', null)).toBe(null);
	});

	it('should handle edge cases for number type', () => {
		expect(stringify('number', NaN)).toBe(null);
		expect(stringify('number', Infinity)).toBe('Infinity');
		expect(stringify('number', -Infinity)).toBe('-Infinity');
	});

	it('should handle invalid Date objects', () => {
		expect(stringify('date', new Date('invalid'))).toBe(null);
	});

	it('should handle very large numbers', () => {
		expect(stringify('number', 1e20)).toBe('100000000000000000000');
	});

	it('should handle special characters in strings', () => {
		expect(stringify('string', 'Hello, 世界!')).toBe('Hello, 世界!');
	});

	it('should handle empty string', () => {
		expect(stringify('string', '')).toBe('');
	});

	it('should handle zero as a valid number', () => {
		expect(stringify('number', 0)).toBe('0');
	});

	it('should handle boolean edge cases', () => {
		expect(stringify('boolean', 1)).toBe('true');
		expect(stringify('boolean', 0)).toBe('false');
		expect(stringify('boolean', '')).toBe('false');
	});
});

describe('stringifyArray', () => {
	const schema: Schema = {
		numbers: 'number[]',
		strings: 'string[]',
		dates: 'date[]',
		booleans: 'boolean[]'
	};

	it('should stringify number arrays', () => {
		expect(stringifyArray('numbers', [1, 2, 3], schema)).toBe('["1","2","3"]');
		expect(stringifyArray('numbers', [], schema)).toBe(null);
	});

	it('should stringify string arrays', () => {
		expect(stringifyArray('strings', ['a', 'b', 'c'], schema)).toBe('["a","b","c"]');
		expect(stringifyArray('strings', [], schema)).toBe(null);
	});

	it('should stringify date arrays', () => {
		const dates = [new Date('2023-04-01T12:00:00Z'), new Date('2023-04-02T12:00:00Z')];
		expect(stringifyArray('dates', dates, schema)).toBe(
			'["2023-04-01T12:00:00.000Z","2023-04-02T12:00:00.000Z"]'
		);
		expect(stringifyArray('dates', [], schema)).toBe(null);
	});

	it('should stringify boolean arrays', () => {
		expect(stringifyArray('booleans', [true, false, true], schema)).toBe('["true","false","true"]');
		expect(stringifyArray('booleans', [], schema)).toBe(null);
	});

	it('should handle arrays with null or undefined values', () => {
		const schema: Schema = { mixed: 'number[]' };
		expect(stringifyArray('mixed', [1, null, 3, undefined, 5], schema)).toBe('["1","3","5"]');
	});

	it('should handle very large arrays', () => {
		const largeArray = Array(10000).fill(1);
		const schema: Schema = { numbers: 'number[]' };
		const result = stringifyArray('numbers', largeArray, schema);
		expect(result).toBeTruthy();
		expect(JSON.parse(result!).length).toBe(10000);
	});

	it('should handle arrays with mixed types', () => {
		const schema: Schema = { mixed: 'string[]' };
		expect(stringifyArray('mixed', ['a', 1, true, new Date('2023-04-01T12:00:00Z')], schema)).toBe(
			'["a","1","true","2023-04-01T12:00:00.000Z"]'
		);
	});

	it('should handle arrays with all null values', () => {
		const schema: Schema = { nulls: 'number[]' };
		expect(stringifyArray('nulls', [null, null, null], schema)).toBe(null);
	});

	it('should handle arrays with special characters', () => {
		const schema: Schema = { special: 'string[]' };
		expect(stringifyArray('special', ['a"b', 'c\\d', 'e\nf'], schema)).toBe(
			'["a\\"b","c\\\\d","e\\nf"]'
		);
	});
});

describe('parse', () => {
	it('should parse string values', () => {
		expect(parse('string', 'hello')).toBe('hello');
		expect(parse('string', '')).toBe(null);
	});

	it('should parse number values', () => {
		expect(parse('number', '42')).toBe(42);
		expect(parse('number', '0')).toBe(0);
		expect(parse('number', '')).toBe(null);
		expect(parse('number', 'not a number')).toBe(null);
	});

	it('should parse date values', () => {
		expect(parse('date', '2023-04-01T12:00:00Z')).toEqual(new Date('2023-04-01T12:00:00Z'));
		expect(parse('date', '')).toBe(null);
		expect(parse('date', 'invalid date')).toBe(null);
	});

	it('should parse boolean values', () => {
		expect(parse('boolean', 'true')).toBe(true);
		expect(parse('boolean', 'false')).toBe(false);
		expect(parse('boolean', '')).toBe(null);
		expect(parse('boolean', 'invalid')).toBe(null);
	});

	it('should parse floating-point numbers', () => {
		expect(parse('number', '3.14')).toBe(3.14);
		expect(parse('number', '-0.01')).toBe(-0.01);
		expect(parse('number', '0.0')).toBe(0);
		expect(parse('number', '1e-10')).toBe(1e-10);
	});

	it('should handle whitespace-only strings', () => {
		expect(parse('string', '   ')).toBe('   ');
	});

	it('should handle extremely large or small numbers', () => {
		expect(parse('number', '1e20')).toBe(1e20);
		expect(parse('number', '1e-20')).toBe(1e-20);
		expect(parse('number', '9007199254740991')).toBe(9007199254740991); // MAX_SAFE_INTEGER
		expect(parse('number', '9007199254740992')).toBe(9007199254740992); // MAX_SAFE_INTEGER + 1
	});

	it('should parse different date formats', () => {
		expect(parse('date', '2023-04-01')).toEqual(new Date('2023-04-01'));
		expect(parse('date', 'Sat, 01 Apr 2023 12:00:00 GMT')).toEqual(
			new Date('2023-04-01T12:00:00.000Z')
		);
	});

	it('should handle boolean-like strings', () => {
		expect(parse('boolean', 'TRUE')).toBe(true);
		expect(parse('boolean', 'FALSE')).toBe(false);
		expect(parse('boolean', '1')).toBe(null);
		expect(parse('boolean', '0')).toBe(null);
	});

	it('should handle special number cases', () => {
		expect(parse('number', 'Infinity')).toBe(Infinity);
		expect(parse('number', '-Infinity')).toBe(-Infinity);
		expect(parse('number', 'NaN')).toBe(null);
	});

	it('should handle date edge cases', () => {
		expect(parse('date', '0')).toEqual(new Date(0));
		expect(parse('date', '1970-01-01T00:00:00Z')).toEqual(new Date(0));
	});
});

describe('parseURL', () => {
	const schema: Schema = {
		id: 'number',
		name: 'string',
		active: 'boolean',
		created: 'date',
		tags: 'string[]'
	};

	it('should parse URL string', () => {
		const url =
			'https://example.com?id=42&name=John&active=true&created=2023-04-01T12:00:00Z&tags=["tag1","tag2"]';
		const result = parseURL(url, schema);
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
			'https://example.com?id=42&name=John&active=true&created=2023-04-01T12:00:00Z&tags=["tag1","tag2"]'
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
		const url = 'https://example.com?id=42&name=John';
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: null,
			created: null,
			tags: null
		});
	});

	it('should handle invalid values', () => {
		const url = 'https://example.com?id=invalid&active=maybe&created=not-a-date&tags=not-an-array';
		const result = parseURL(url, schema);
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
		const url = 'https://example.com?name=John%20Doe';
		expect(parseURL(url, schema)).toEqual({ name: 'John Doe' });
	});

	it('should handle duplicate parameters', () => {
		const schema: Schema = { tags: 'string[]' };
		const url = 'https://example.com?tags=["tag1"]&tags=["tag2"]';
		expect(parseURL(url, schema)).toEqual({ tags: ['tag1'] }); // It uses the first occurrence
	});

	it('should handle a complex nested schema', () => {
		const complexSchema: Schema = {
			id: 'number',
			user: 'string',
			preferences: 'string[]',
			lastLogin: 'date'
		};
		const url =
			'https://example.com?id=123&user=john&preferences=["dark","compact"]&lastLogin=2023-04-01T12:00:00Z';
		const result = parseURL(url, complexSchema);
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
		const url = `https://example.com?longParam=${longValue}`;
		const result = parseURL(url, longSchema);
		expect(result.longParam).toBe(longValue);
	});

	it('should handle all parameters being invalid or empty', () => {
		const schema: Schema = {
			id: 'number',
			name: 'string',
			active: 'boolean',
			created: 'date',
			tags: 'string[]'
		};
		const url = 'https://example.com?id=&name=&active=&created=&tags=';
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: null,
			name: null,
			active: null,
			created: null,
			tags: null
		});
	});

	it('should handle URLs with hash fragments', () => {
		const url = 'https://example.com?id=42&name=John#section1';
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: null,
			created: null,
			tags: null
		});
	});

	it('should handle URLs with query parameters in unusual order', () => {
		const url =
			'https://example.com?active=true&id=42&name=John&created=2023-04-01T12:00:00Z&tags=["tag1","tag2"]';
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: true,
			created: new Date('2023-04-01T12:00:00Z'),
			tags: ['tag1', 'tag2']
		});
	});

	it('should handle URLs with repeated parameters', () => {
		const url = 'https://example.com?id=42&id=43&name=John&name=Jane';
		const result = parseURL(url, schema);
		expect(result).toEqual({
			id: 42,
			name: 'John',
			active: null,
			created: null,
			tags: null
		});
	});
});
