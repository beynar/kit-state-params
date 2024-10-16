import type { Schema } from '../src/lib/types.js';
import { describe, expect, it } from 'vitest';

import { createProxy } from '$lib/proxy.js';

const schema = {
	string: 'string',
	date: 'date',
	arrayString: ['string'],
	array: [
		{
			boolean: 'boolean',
			object: {
				number: 'number'
			}
		}
	],
	object: {
		boolean: 'boolean',
		object: {
			number: 'number'
		}
	}
} satisfies Schema;

const object = {
	string: 'test string',
	date: new Date('2023-05-01T12:00:00Z'),
	arrayString: [],
	array: [
		{
			boolean: true,
			object: {
				number: 42
			}
		},
		{
			boolean: false,
			object: {
				number: 24
			}
		}
	],
	object: {
		boolean: false,
		object: {
			number: 24
		}
	}
};

describe('proxy', () => {
	it('should update the search params with nested properties', () => {
		const url = new URL('http://localhost');

		const proxyWithNestedUpdates = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				url.searchParams.set(path, value);
			},
			searchParams: url.searchParams,
			reset: () => {
				console.log('Reset');
			}
		});
		console.log(proxyWithNestedUpdates.array[0].object);
		proxyWithNestedUpdates.string = 'new string';
		proxyWithNestedUpdates.date = new Date('2023-05-01T12:00:00Z');
		proxyWithNestedUpdates.array[0].object.number = 30;
		proxyWithNestedUpdates.object.boolean = true;
		proxyWithNestedUpdates.arrayString.push('hello');
		proxyWithNestedUpdates.arrayString.unshift('test', 'test');
		proxyWithNestedUpdates.arrayString.push('end');
		proxyWithNestedUpdates.arrayString.unshift('start');

		expect(url.searchParams.get('arrayString.0')).toBe('start');
		expect(url.searchParams.get('arrayString.1')).toBe('test');

		expect(JSON.parse(JSON.stringify(proxyWithNestedUpdates.arrayString))).toStrictEqual([
			'start',
			'test',
			'test',
			'hello',
			'end'
		]);

		expect(url.searchParams.get('string')).toBe('new string');
		expect(url.searchParams.get('date')).toBe(new Date('2023-05-01T12:00:00Z').toISOString());
		expect(url.searchParams.get('array.0.object.number')).toBe('30');
		expect(url.searchParams.get('object.boolean')).toBe('true');
		expect(url.searchParams.get('arrayString.2')).toBe('test');
		expect(url.searchParams.get('arrayString.3')).toBe('hello');
		expect(url.searchParams.get('arrayString.4')).toBe('end');
		console.log(proxyWithNestedUpdates.object.boolean);
		expect(proxyWithNestedUpdates.string).toBe('new string');
		expect(proxyWithNestedUpdates.array[0].object.number).toBe(30);
		expect(proxyWithNestedUpdates.object.boolean).toBe(true);
		expect(proxyWithNestedUpdates.arrayString.length).toBe(5);
		expect(proxyWithNestedUpdates.object.object.number).toBe(24);
		expect(proxyWithNestedUpdates.array[1].boolean).toBe(false);
		expect(proxyWithNestedUpdates.date).toEqual(object.date);
		expect('nonexistent' in proxyWithNestedUpdates).toBe(false);
	});
});
