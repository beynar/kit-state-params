import type { Enum } from './enum.js';

export type Primitive = 'string' | 'number' | 'date' | 'boolean' | `<${string}>`;

type InferEnum<T> = T extends `<${infer U}>`
	? U extends `${infer First},${infer Rest}`
		? First | InferEnum<`<${Rest}>`>
		: U | null
	: never;

export type OutputOfPrimitive<T extends Primitive> =
	T extends Enum<infer E>
		? E
		: T extends 'string'
			? string | null
			: T extends 'number'
				? number | null
				: T extends 'date'
					? Date | null
					: T extends 'boolean'
						? boolean | null
						: InferEnum<T>;

export type SchemaOutput<T extends Schema> = {
	[K in keyof T]: T[K] extends Primitive
		? OutputOfPrimitive<T[K]>
		: T[K] extends Schema
			? SchemaOutput<T[K]>
			: T[K] extends [Schema]
				? SchemaOutput<T[K][number]>[]
				: T[K] extends [Primitive]
					? OutputOfPrimitive<T[K][number]>[]
					: never;
};

export type Opts<S extends Schema> = {
	schema: S;
	debounce?: number;
	pushHistory?: boolean;
	twoWayBinding?: boolean;
	preserveUnknownParams?: boolean;
	invalidateAll?: boolean;
	invalidate?: (string | URL)[];
	shallow?: boolean;
};
export type PrimitiveSchema = Record<string, Primitive>;

export type Schema = {
	[key: string]: Primitive | Schema | [Schema] | [Primitive];
};
