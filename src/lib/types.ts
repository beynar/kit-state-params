import { type SimplifyDeep } from 'type-fest';
export type Simplify<T> = SimplifyDeep<T>;

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

type Get<T, K> = K extends keyof T ? T[K] : undefined;

type MaybeNotNullable<T, D, Enforce extends boolean> = D extends undefined
	? T
	: Enforce extends true
		? Exclude<T, null>
		: T;

export type SchemaOutput<T extends Schema, D = undefined, Enforce extends boolean = false> = {
	[K in keyof T]: T[K] extends Primitive
		? MaybeNotNullable<OutputOfPrimitive<T[K]>, Get<D, K>, Enforce>
		: T[K] extends Schema
			? SchemaOutput<T[K], Get<D, K>>
			: T[K] extends [Schema]
				? SchemaOutput<T[K][number], Get<D, K>, Enforce>[]
				: T[K] extends [Primitive]
					? MaybeNotNullable<OutputOfPrimitive<T[K][number]>, D, Enforce>[]
					: never;
};

export type Opts<
	S extends Schema,
	D extends Default<S> | undefined,
	Enforce extends boolean = false
> = {
	schema: S;
	default?: D;
	enforceDefault?: Enforce;
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

export type Default<T extends Schema> = {
	[K in keyof T]?: T[K] extends Primitive
		? NonNullable<OutputOfPrimitive<T[K]>>
		: T[K] extends Schema
			? Default<T[K]>
			: T[K] extends [Schema]
				? Default<T[K][number]>[]
				: T[K] extends [Primitive]
					? NonNullable<OutputOfPrimitive<T[K][0]>>[]
					: never;
};
