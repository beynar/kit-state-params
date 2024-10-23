import type { Default, Schema } from '$lib/types.js';
import { parseURL } from '$lib/utils.js';
import { describe, expect, it } from 'vitest';

describe('traverseSchema', () => {
	const schema = {
		id: 'number',
		name: 'string',
		nested: {
			id: 'number',
			name: 'string'
		},
		primitiveArray: ['number'],
		objectArray: [
			{
				id: 'number',
				name: 'string'
			}
		]
	};
	const follower = {
		id: 1,
		name: 'John Doe',
		nested: {
			id: 2,
			name: 'Jane Doe'
		},
		primitiveArray: ['1', '2', '3'],
		objectArray: [
			{
				id: 3,
				name: 'Jim Doe'
			}
		]
	};

	it('should traverse the schema and call the callback for each key', () => {
		const result: any[] = [];
		traverseSchema({ schema, value: follower, cb: (opts) => result.push(opts) });
		expect(result).toEqual([{ path: 'id', schema: 'number', isArray: false }]);
	});
});
