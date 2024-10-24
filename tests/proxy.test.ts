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
		// console.log(proxyWithNestedUpdates.array[0].object);
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

		expect(proxyWithNestedUpdates.string).toBe('new string');
		expect(proxyWithNestedUpdates.array[0].object.number).toBe(30);
		expect(proxyWithNestedUpdates.object.boolean).toBe(true);
		expect(proxyWithNestedUpdates.arrayString.length).toBe(5);
		expect(proxyWithNestedUpdates.object.object.number).toBe(24);
		expect(proxyWithNestedUpdates.array[1].boolean).toBe(false);
		expect(proxyWithNestedUpdates.date).toEqual(object.date);
		expect('nonexistent' in proxyWithNestedUpdates).toBe(false);

		proxyWithNestedUpdates.arrayString = [];
		expect(url.searchParams.get('arrayString')).toBe(null);
		proxyWithNestedUpdates.arrayString = ['test'];
		expect(url.searchParams.get('arrayString.0')).toBe('test');

		proxyWithNestedUpdates.object = {
			boolean: false,
			object: {
				number: 42
			}
		};

		expect(url.searchParams.get('object.boolean')).toBe('false');
		expect(url.searchParams.get('object.object.number')).toBe('42');

		proxyWithNestedUpdates.array = [
			{
				boolean: false,
				object: {
					number: 24
				}
			},
			{
				boolean: true,
				object: {
					number: 42
				}
			}
		];

		expect(url.searchParams.get('array.0.boolean')).toBe('false');
		expect(url.searchParams.get('array.0.object.number')).toBe('24');
		expect(url.searchParams.get('array.1.boolean')).toBe('true');
		expect(url.searchParams.get('array.1.object.number')).toBe('42');
	});

	it('should coerce and update arrays correctly', () => {
		const url = new URL('http://localhost');

		const proxyWithArrayUpdates = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				url.searchParams.set(path, value);
			},
			searchParams: url.searchParams,
			reset: () => {
				console.log('Reset');
			}
		});

		// Test assigning a new array of strings
		proxyWithArrayUpdates.arrayString = ['one', 'two', 'three'];
		expect(proxyWithArrayUpdates.arrayString).toEqual(['one', 'two', 'three']);
		// expect(url.searchParams.get('arrayString.0')).toBe('one');
		// expect(url.searchParams.get('arrayString.1')).toBe('two');
		// expect(url.searchParams.get('arrayString.2')).toBe('three');

		// // Test assigning an array with invalid values (should be filtered out)
		// proxyWithArrayUpdates.arrayString = ['valid', null, 'also valid', undefined, ''];
		// expect(proxyWithArrayUpdates.arrayString).toEqual(['valid', 'also valid']);
		// expect(url.searchParams.get('arrayString.0')).toBe('valid');
		// expect(url.searchParams.get('arrayString.1')).toBe('also valid');
		// expect(url.searchParams.get('arrayString.2')).toBe(null);

		// // Test assigning a new array of objects
		// proxyWithArrayUpdates.array = [
		// 	{ boolean: true, object: { number: 100 } },
		// 	{ boolean: false, object: { number: 200 } }
		// ];
		// expect(proxyWithArrayUpdates.array).toEqual([
		// 	{ boolean: true, object: { number: 100 } },
		// 	{ boolean: false, object: { number: 200 } }
		// ]);
		// expect(url.searchParams.get('array.0.boolean')).toBe('true');
		// expect(url.searchParams.get('array.0.object.number')).toBe('100');
		// expect(url.searchParams.get('array.1.boolean')).toBe('false');
		// expect(url.searchParams.get('array.1.object.number')).toBe('200');
	});

	it('should coerce and update nested objects correctly', () => {
		const url = new URL('http://localhost');

		const proxyWithObjectUpdates = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				url.searchParams.set(path, value);
			},
			searchParams: url.searchParams,
			reset: () => {
				console.log('Reset');
			}
		});

		// Test assigning a new nested object
		proxyWithObjectUpdates.object = {
			boolean: true,
			object: {
				number: 999
			}
		};
		expect(proxyWithObjectUpdates.object).toEqual({
			boolean: true,
			object: {
				number: 999
			}
		});
		expect(url.searchParams.get('object.boolean')).toBe('true');
		expect(url.searchParams.get('object.object.number')).toBe('999');

		// Test assigning an object with invalid values (should be coerced)
		proxyWithObjectUpdates.object = {
			boolean: 'invalid',
			object: {
				number: '888'
			}
		};

		expect(proxyWithObjectUpdates.object).toEqual({
			boolean: null,
			object: {
				number: 888
			}
		});

		expect(url.searchParams.get('object.boolean')).toBe('null');
		expect(url.searchParams.get('object.object.number')).toBe('888');
	});

	it('should handle complex array assignments and manipulations', () => {
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

		const url = new URL('http://localhost');

		const proxyWithComplexArrays = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				url.searchParams.set(path, value);
			},
			searchParams: url.searchParams,
			clearPaths: (path) => {
				Array.from(url.searchParams.keys()).forEach((key) => {
					if (key.startsWith(path)) {
						url.searchParams.delete(key);
					}
				});
			},
			reset: () => {
				console.log('Reset');
			}
		});

		// Test assigning a complex array of objects
		proxyWithComplexArrays.array = [
			{ boolean: true, object: { number: 100 } },
			{ boolean: false, object: { number: 200 } },
			{ boolean: true, object: { number: 300 } }
		];

		expect(proxyWithComplexArrays.array).toEqual([
			{ boolean: true, object: { number: 100 } },
			{ boolean: false, object: { number: 200 } },
			{ boolean: true, object: { number: 300 } }
		]);

		// Remove console.dir since we don't need it anymore
		expect(url.searchParams.get('array.0.boolean')).toBe('true');
		expect(url.searchParams.get('array.0.object.number')).toBe('100');
		expect(url.searchParams.get('array.1.boolean')).toBe('false');
		expect(url.searchParams.get('array.1.object.number')).toBe('200');
		expect(url.searchParams.get('array.2.boolean')).toBe('true');
		expect(url.searchParams.get('array.2.object.number')).toBe('300');

		// Test array manipulation methods
		proxyWithComplexArrays.array.push({ boolean: false, object: { number: 400 } });
		expect(proxyWithComplexArrays.array.length).toBe(4);
		expect(url.searchParams.get('array.3.boolean')).toBe('false');
		expect(url.searchParams.get('array.3.object.number')).toBe('400');

		proxyWithComplexArrays.array.pop();
		expect(proxyWithComplexArrays.array.length).toBe(3);
		expect(proxyWithComplexArrays.array[3]).toBe(undefined);

		expect(url.searchParams.get('array.3.boolean')).toBe(null);
		expect(url.searchParams.get('array.3.object.number')).toBe(null);

		proxyWithComplexArrays.array.unshift({ boolean: true, object: { number: 50 } });
		expect(proxyWithComplexArrays.array.length).toBe(4);
		expect(url.searchParams.get('array.0.boolean')).toBe('true');
		expect(url.searchParams.get('array.0.object.number')).toBe('50');

		proxyWithComplexArrays.array.shift();
		expect(proxyWithComplexArrays.array.length).toBe(3);
		expect(url.searchParams.get('array.0.boolean')).toBe('true');
		expect(url.searchParams.get('array.0.object.number')).toBe('100');

		// Test array splice
		proxyWithComplexArrays.array.splice(1, 1, { boolean: true, object: { number: 250 } });
		expect(proxyWithComplexArrays.array.length).toBe(3);
		expect(url.searchParams.get('array.1.boolean')).toBe('true');
		expect(url.searchParams.get('array.1.object.number')).toBe('250');
	});

	it('should handle nested object assignments and manipulations', () => {
		const url = new URL('http://localhost');

		const proxyWithNestedObjects = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				if (!value) {
					url.searchParams.delete(path);
				} else {
					url.searchParams.set(path, value);
				}
			},
			searchParams: url.searchParams,
			reset: () => {
				console.log('Reset');
			}
		});

		// Test assigning a complex nested object
		proxyWithNestedObjects.object = {
			boolean: true,
			object: {
				number: 999,
				nested: {
					string: 'nested string',
					array: [1, 2, 3]
				}
			}
		};

		console.log('proxyWithNestedObjects.object', proxyWithNestedObjects.object);
		expect(proxyWithNestedObjects.object).toEqual({
			boolean: true,
			object: {
				number: 999
			}
		});

		expect(url.searchParams.get('object.boolean')).toBe('true');
		expect(url.searchParams.get('object.object.number')).toBe('999');
		expect(url.searchParams.get('object.object.nested.string')).toBe(null);
		expect(url.searchParams.get('object.object.nested.array.0')).toBe(null);
		expect(url.searchParams.get('object.object.nested.array.1')).toBe(null);
		expect(url.searchParams.get('object.object.nested.array.2')).toBe(null);
	});

	it('should handle edge cases and type coercion', () => {
		const url = new URL('http://localhost');

		const proxyWithEdgeCases = createProxy(object, {
			schema,
			onUpdate: (path, value) => {
				if (!value) {
					url.searchParams.delete(path);
				} else {
					url.searchParams.set(path, value);
				}
			},
			clearPaths: (path) => {
				Array.from(url.searchParams.keys()).forEach((key) => {
					if (key.startsWith(path)) {
						url.searchParams.delete(key);
					}
				});
			},
			searchParams: url.searchParams,
			reset: () => {
				console.log('Reset');
			}
		});

		// Test assigning null and undefined
		proxyWithEdgeCases.string = null;
		expect(proxyWithEdgeCases.string).toBe(null);
		console.log(url.searchParams.toString());
		expect(url.searchParams.get('string')).toBe(null);

		proxyWithEdgeCases.string = undefined;
		expect(proxyWithEdgeCases.string).toBe(null);
		expect(url.searchParams.get('string')).toBe(null);

		// Test type coercion for primitives
		proxyWithEdgeCases.string = 42;
		console.log(proxyWithEdgeCases.string);
		expect(proxyWithEdgeCases.string).toBe('42');
		expect(url.searchParams.get('string')).toBe('42');

		proxyWithEdgeCases.array[0].boolean = 1;
		expect(proxyWithEdgeCases.array[0].boolean).toBe(true);
		expect(url.searchParams.get('array.0.boolean')).toBe('true');

		proxyWithEdgeCases.array[0].object.number = '42.5';
		expect(proxyWithEdgeCases.array[0].object.number).toBe(42.5);
		expect(url.searchParams.get('array.0.object.number')).toBe('42.5');

		// Test date handling
		const testDate = new Date('2023-05-01T12:00:00Z');
		proxyWithEdgeCases.date = testDate;
		expect(proxyWithEdgeCases.date).toEqual(testDate);
		expect(url.searchParams.get('date')).toBe(testDate.toISOString());

		proxyWithEdgeCases.date = '2023-06-01';
		expect(proxyWithEdgeCases.date).toEqual(new Date('2023-06-01'));
		expect(url.searchParams.get('date')).toBe(new Date('2023-06-01').toISOString());
	});
});
