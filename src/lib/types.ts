import type { Schema as ZodSchema, infer as ZOutput, ZodObject as ZO, ZodArray as ZA } from 'zod';

export type Simplify<T> = {
	[KeyType in keyof T]: T[KeyType] extends SchemaOutput<infer O>
		? Simplify<SchemaOutput<O>>
		: T[KeyType];
} & {};

export type Primitive = 'string' | 'number' | 'date' | 'boolean' | `<${string}>`;

type InferEnum<T> = T extends `<${infer U}>`
	? U extends `${infer First},${infer Rest}`
		? First | InferEnum<`<${Rest}>`>
		: U | null
	: never;

export type OutputOfPrimitive<T extends Primitive> = T extends 'string'
	? string | null
	: T extends 'number'
		? number | null
		: T extends 'date'
			? Date | null
			: T extends 'boolean'
				? boolean | null
				: InferEnum<T>;

export type SchemaOutput<T extends Schema> = T extends ZodSchema
	? ZOutput<T>
	: {
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

export type SimpleSchema = {
	[key: string]: Primitive | Schema | [Schema] | [Primitive];
};
export type Schema = SimpleSchema | ZodSchema;
export type { ZodSchema };
export type ZodObject = ZO<any, any, any, any, any>;
export type ZodArray = ZA<any, any>;
