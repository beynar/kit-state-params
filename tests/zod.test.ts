import { createProxy } from '$lib/proxy.js';
import { parseURL } from '$lib/utils.js';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('zod', () => {
	// it('should parse and validate URL parameters', () => {
	// 	const schema = z.object({
	// 		num: z.coerce.number().default(10),
	// 		bool: z.coerce.boolean().default(false),
	// 		emails: z
	// 			.array(
	// 				z.object({
	// 					num: z.coerce.number().default(10),
	// 					bool: z.coerce.boolean().default(false),
	// 					emails: z.array(z.string().email('invalid email address')).default([]),
	// 					some: z.enum(['a', 'b']).default('a')
	// 				})
	// 			)
	// 			.default([]),
	// 		some: z.enum(['a', 'b']).default('a')
	// 	});

	// 	const array = z.array(
	// 		z.object({
	// 			num: z.coerce.number().default(10),
	// 			bool: z.coerce.boolean().default(false),
	// 			emails: z.array(z.string().email('invalid email address')).default([]),
	// 			some: z.enum(['a', 'b']).default('a')
	// 		})
	// 	);

	// 	const params = {};
	// 	const result = schema.safeParse(params);
	// 	// console.log({ result });

	// 	// console.log(result.data);
	// 	expect(result.data).toBeDefined();
	// });

	const schema = z.object({
		num: z.coerce.number().default(10),
		bool: z.coerce.boolean().default(false),
		emails: z.array(z.string().email('invalid email address')).catch([]).default([]),
		some: z.enum(['a', 'b']).default('a'),
		nested: z.object({
			nested: z.array(
				z.object({
					string: z.string().nullable()
				})
			),
			string: z.string().default('test')
		})
	});
	it('should parse and validate URL parameters', () => {
		console.log('here');
		const url = new URL('http://localhost?num=10&bool=true&emails=test@test.com&some=b');
		const result = parseURL(url.searchParams, schema);

		console.log({ result }, 'here');
		expect(result).toBeDefined();
	});
	it('should parse and validate URL parameters', () => {
		const url = new URL('http://localhost');
		const proxyState = createProxy(
			{
				num: 10,
				bool: false,
				emails: [],
				some: 'a',
				nested: { nested: [], string: 'test' }
			},
			{
				zodMode: true,
				schema,
				onUpdate: (path, value) => {
					url.searchParams.set(path, value);
				},
				searchParams: url.searchParams,
				reset: () => {
					console.log('Reset');
				}
			}
		);

		proxyState.bool = false;
		// console.log(proxyState);
	});
});
