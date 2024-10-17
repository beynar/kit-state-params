import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Primitive, Schema, SchemaOutput, ZodArray, ZodObject, ZodSchema } from './types.js';

export const debounce = (fn: () => void, delay: number) => {
	let timeout: number;
	return () => {
		clearTimeout(timeout);
		timeout = setTimeout(fn, delay);
	};
};

const validateEnum = (enumType: string, value: string | null) => {
	if (!value) return false;
	const types = enumType.replace('<', '').replace('>', '').split(',');
	return types.includes(value);
};

export const stringifyPrimitive = (primitiveType: Primitive, value: any): string | null => {
	if (value === null || value === undefined) {
		return null;
	}
	switch (primitiveType) {
		case 'string': {
			return String(value);
		}
		case 'number': {
			return isNaN(value) ? null : value.toString();
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
export const toString = (value?: any) => {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number') {
		return value.toString();
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	return String(value);
};

export const parsePrimitive = (primitiveType: Primitive, value: string | null) => {
	if (value === 'null') return null;
	switch (primitiveType) {
		case 'string': {
			return value || null;
		}
		case 'number': {
			if (!value) return null;
			const parsed = Number(value);
			return isNaN(parsed) ? null : parsed;
		}
		case 'date': {
			return value
				? isNaN(new Date(value).getTime())
					? null
					: new Date(value === '0' ? 0 : value)
				: null;
		}

		case 'boolean': {
			return typeof value === 'boolean'
				? value
				: typeof value === 'string'
					? value.toLowerCase() === 'true'
						? true
						: value.toLowerCase() === 'false'
							? false
							: null
					: null;
		}
		default: {
			return validateEnum(primitiveType, value) ? value : null;
		}
	}
};

export const isZodSchema = (schema: Schema | any): schema is ZodSchema => {
	return typeof schema === 'object' && 'safeParse' in schema;
};

const isArraySchema = (schema: Schema | any): schema is ZodArray => {
	return typeof schema === 'object' && 'element' in schema;
};

const isObjectSchema = (schema: Schema | any): schema is ZodObject => {
	return typeof schema === 'object' && 'shape' in schema;
};

export const shape = (schema: Schema | any) => {
	if (isObjectSchema(schema)) {
		return schema.shape;
	}
	if (isArraySchema(schema)) {
		return schema.element.shape;
	}
	return schema;
};
export const parseURL = <S extends Schema>(
	data: string | URL | URLSearchParams | SvelteURLSearchParams,
	schema: S
): SchemaOutput<S> => {
	const zodMode = isZodSchema(schema);

	const searchParams =
		typeof data === 'string'
			? new URL(data).searchParams
			: data instanceof URL
				? data.searchParams
				: data;
	const paths = Array.from(searchParams.entries());
	const result: any = {};
	const pathMap = new Map(paths);

	const parseSchemaRecursive = (
		currentSchema: any,
		currentResult: any,
		currentPath: string = ''
	) => {
		for (const [key, schemaType] of Object.entries(currentSchema)) {
			zodMode && console.log(key);
			const newPath = currentPath ? `${currentPath}.${key}` : key;
			const isObject = (!zodMode && typeof schemaType === 'object') || isObjectSchema(schemaType);
			const isArray = (!zodMode && Array.isArray(schemaType)) || isArraySchema(schemaType);
			const isPrimitive = (!zodMode && typeof schemaType === 'string') || !(isObject || isArray);

			if (isPrimitive) {
				// Handle primitive types
				const value = pathMap.get(newPath);
				if (zodMode) {
					console.log({ key });
					currentResult[key] = value;
				} else {
					currentResult[key] = value
						? parsePrimitive(schemaType as Primitive, value)
						: zodMode
							? undefined
							: null;
				}
			} else if (isArray) {
				// Handle array types
				currentResult[key] = [];
				const arraySchema = zodMode ? shape(schemaType) : (schemaType as [Primitive])[0];

				for (let i = 0; ; i++) {
					const arrayPath = `${newPath}.${i}`;
					if (typeof arraySchema === 'string') {
						const value = pathMap.get(arrayPath);
						if (value === undefined) break;
						if (zodMode) {
							currentResult[key].push((value ?? zodMode) ? undefined : null);
						} else {
							currentResult[key].push(parsePrimitive(arraySchema as Primitive, value));
						}
					} else {
						if (!Array.from(pathMap.keys()).some((path) => path.startsWith(arrayPath))) break;
						currentResult[key][i] = {};
						parseSchemaRecursive(arraySchema, currentResult[key][i], arrayPath);
					}
				}
			} else if (isObject) {
				// Handle nested object types
				currentResult[key] = {};
				parseSchemaRecursive(shape(schemaType), currentResult[key], newPath);
			}
		}
	};

	parseSchemaRecursive(shape(schema), result);
	if (zodMode) {
		const parsed = schema.safeParse(result);
		if (parsed.success) {
			return parsed.data as SchemaOutput<S>;
		}
		throw new Error(parsed.error.message);
	}
	return result;
};

export const isValidPath = (path: string, schema: Schema): boolean => {
	const parts = path.split('.');
	let currentSchema: any = shape(schema);

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (typeof currentSchema === 'string') return false;

		if (Array.isArray(currentSchema)) {
			if (!/^\d+$/.test(part)) return false;
			currentSchema = currentSchema[0];
			continue;
		}

		if (typeof currentSchema !== 'object' || currentSchema === null || !(part in currentSchema)) {
			return false;
		}

		currentSchema = currentSchema[part];
	}

	return true;
};
