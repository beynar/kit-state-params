export type Primitive = 'string' | 'number' | 'date' | 'boolean';

export type OutputOfPrimitive<T extends Primitive> = T extends 'string'
	? string | null
	: T extends 'number'
		? number | null
		: T extends 'date'
			? Date | null
			: T extends 'boolean'
				? boolean | null
				: never;

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
};
export type PrimitiveSchema = Record<string, Primitive>;

export type Schema = {
	[key: string]: Primitive | Schema | [Schema] | [Primitive];
};
