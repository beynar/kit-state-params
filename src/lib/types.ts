export type Primitive = 'string' | 'number' | 'date' | 'boolean';
export type PrimitiveArray = `${Primitive}[]`;
export type SchemaType = Primitive | PrimitiveArray;

export type OutputOfPrimitive<T extends Primitive> = T extends 'string'
	? string | null
	: T extends 'number'
		? number | null
		: T extends 'date'
			? Date | null
			: T extends 'boolean'
				? boolean | null
				: never;
export type OutputOfPrimitiveArray<T extends PrimitiveArray> = T extends `${infer P}[]`
	? P extends Primitive
		? OutputOfPrimitive<P>[]
		: never
	: never;
export type OutputOfSchema<T extends SchemaType> = T extends PrimitiveArray
	? OutputOfPrimitiveArray<T>
	: T extends Primitive
		? OutputOfPrimitive<T>
		: never;

export type SchemaOutput<T extends Schema> = {
	[K in keyof T]: T[K] extends SchemaType ? OutputOfSchema<T[K]> : never;
};

export type Opts<S extends Schema> = {
	schema: S;
	debounce?: number;
	pushHistory?: boolean;
};
export type Schema = Record<string, Primitive | PrimitiveArray>;
