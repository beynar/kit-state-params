import type { Schema, SchemaOutput } from '$lib/types.js';
import { describe, expectTypeOf, it } from 'vitest';
type DeepNonNullable<T> = T extends object
	? T extends Date
		? NonNullable<T>
		: { [K in keyof T]: DeepNonNullable<T[K]> }
	: T extends Array<infer U>
		? { [K in keyof T]: DeepNonNullable<T[K]> }
		: T extends null | undefined
			? never
			: T;
describe('types', () => {
	it('should correctly infer the type', () => {
		const test = {
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
			]
		} satisfies Schema;

		type O = SchemaOutput<typeof test>;

		expectTypeOf({
			string: 'string',
			date: new Date(),
			arrayString: ['string'],
			array: [
				{
					boolean: true,
					object: {
						number: 0
					}
				}
			]
		}).toEqualTypeOf<DeepNonNullable<O>>();
		const c = {} as DeepNonNullable<O>;
	});
});
