import type { OutputOfPrimitive, Primitive, Schema, SchemaOutput } from './types.js';

const validateEnum = (enumType: string, value: string | null) => {
	if (!value) return false;
	const types = enumType.replace('<', '').replace('>', '').split(',');
	return types.includes(value);
};

const isPrimitive = (value: any): value is Primitive => {
	return (
		['string', 'number', 'date', 'boolean'].includes(value) ||
		(value.startsWith('<') && value.endsWith('>'))
	);
};

export const coerceArray = (
	schema: Schema,
	value: string[] | null,
	DEFAULT_VALUE: any = null
): SchemaOutput<Schema>[] => {
	if (!value) return DEFAULT_VALUE;

	return '' as any;
};

export const traverseSchema = (opts: {
	schema: Schema;
	path: string;
	follower: any;
	getValue?: (path: string) => any;
	cb: (p: {
		path: string;
		primitive?: Primitive;
		schema?: Schema;
		isArray: boolean;
		follower?: any | null;
	}) => void;
}) => {
	for (const [key, schemaType] of Object.entries(opts.schema)) {
		const isArray = Array.isArray(schemaType);
		const type = isArray ? schemaType[0] : schemaType;
		const primitive = isPrimitive(type) ? type : undefined;
		const schema = isPrimitive(type) ? undefined : type;

		if (primitive) {
			if (isArray) {
				value.forEach((v: any, index: number) => {
					opts.cb({ path: `${opts.path}.${key}.${index}.`, primitive, isArray });
				});
			} else {
				opts.cb({ path: `${opts.path}.${key}`, primitive, isArray });
			}
		} else if (schema) {
			if (isArray) {
				value.forEach((v: any, index: number) => {
					opts.cb({ path: `${opts.path}.${key}.${index}.`, schema, isArray });
					traverseSchema({
						schema,
						value: v,
						path: `${opts.path}.${key}.${index}`,
						follower: value[index],
						cb: opts.cb
					});
				});
			} else {
				opts.cb({
					path: `${opts.path}.${key}`,
					schema,
					isArray
				});
				traverseSchema({
					schema,
					value: opts.value[key],
					path: `${opts.path}.${key}`,
					follower: opts.value[key],
					cb: opts.cb
				});
			}
		}
	}
};

export const coerceObject = (
	schema: Schema,
	value: any,
	DEFAULT_VALUE: any = null
): SchemaOutput<Schema> => {
	if (!value) return DEFAULT_VALUE;
	const result: Record<string, any> = {};
	for (const [key, schemaType] of Object.entries(schema)) {
		if (typeof schemaType === 'string') {
			// Handle primitive types
			result[key] = coercePrimitive(schemaType as Primitive, value[key], DEFAULT_VALUE);
		} else if (Array.isArray(schemaType)) {
			// Handle array types
			const arraySchema = schemaType[0];
			if (typeof arraySchema === 'string') {
				result[key] = coercePrimitiveArray(arraySchema as Primitive, value[key], DEFAULT_VALUE);
			} else {
				result[key] = coerceArray(arraySchema, value[key], DEFAULT_VALUE);
			}
		} else if (typeof schemaType === 'object') {
			// Handle nested object types
			result[key] = coerceObject(schemaType, value[key], DEFAULT_VALUE);
		}
	}
	return result as SchemaOutput<Schema>;
};

export const coercePrimitiveArray = (
	primitiveType: Primitive,
	value: string[] | null,
	DEFAULT_VALUE: any = null
): OutputOfPrimitive<Primitive>[] => {
	if (!value) return DEFAULT_VALUE;
	return value.map((v) => coercePrimitive(primitiveType, v, null)).filter((v) => v !== null);
};

export const coercePrimitive = (
	primitiveType: Primitive,
	value: string | null,
	DEFAULT_VALUE: any = null
): OutputOfPrimitive<Primitive> => {
	if (value === 'null' || value === '' || value === null) return DEFAULT_VALUE;
	switch (primitiveType) {
		case 'string': {
			return value || DEFAULT_VALUE;
		}
		case 'number': {
			const parsed = Number(value);
			if ((!value || isNaN(parsed)) && parsed !== 0) return DEFAULT_VALUE;
			return parsed;
		}
		case 'date': {
			return value
				? isNaN(new Date(value).getTime())
					? DEFAULT_VALUE
					: new Date(value === '0' ? 0 : value)
				: DEFAULT_VALUE;
		}

		case 'boolean': {
			if (value === null || value === undefined) return DEFAULT_VALUE;
			if (typeof value === 'boolean') return value;
			if (typeof value === 'string') {
				return value.toLowerCase() === 'true'
					? true
					: value.toLowerCase() === 'false'
						? false
						: DEFAULT_VALUE;
			}
			if (value === 1) return true;
			if (value === 0) return false;
			return DEFAULT_VALUE;
		}
		default: {
			// Assume it is an enum
			return validateEnum(primitiveType, value) ? value : DEFAULT_VALUE;
		}
	}
};

export const paramifyArray = (schema: Schema, value: any[]): [string, string][] => {
	return value.map((v) => paramifyObject(schema, v)).filter((v) => v !== null);
};

export const paramifyObject = (schema: Schema, value: any): [string, string][] => {
	// this function should traverse the schema and return an array of paths and values that will be set in the url later
};

export const paramifyPrimitiveArray = (primitiveType: Primitive, value: any[]): string[] => {
	return value.map((v) => paramifyPrimitive(primitiveType, v)).filter((v) => v !== null);
};

export const paramifyPrimitive = (primitiveType: Primitive, value: any): string | null => {
	switch (primitiveType) {
		case 'string': {
			return value === null ? null : String(value);
		}
		case 'number': {
			return value === null ? null : value || value === 0 ? value.toString() : null;
		}
		case 'date': {
			const isDate = value && value instanceof Date && !isNaN(value.getTime());
			return value === null ? null : isDate ? value.toISOString() : null;
		}
		case 'boolean': {
			return value === null ? null : value ? 'true' : 'false';
		}
		default: {
			// it is an enum
			return validateEnum(primitiveType, value) ? value : null;
		}
	}
};
