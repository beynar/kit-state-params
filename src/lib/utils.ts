import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Default, Primitive, Schema, SchemaOutput } from './types.js';

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

const coerceBoolean = (value: any | null, DEFAULT_VALUE: any = null) => {
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
};

export const parsePrimitive = (
	primitiveType: Primitive,
	value: string | null,
	DEFAULT_VALUE: any = null
) => {
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
			return coerceBoolean(value, DEFAULT_VALUE);
		}
		default: {
			return validateEnum(primitiveType, value) ? value : DEFAULT_VALUE;
		}
	}
};

const getSearchParams = (data: string | URL | URLSearchParams | SvelteURLSearchParams) => {
	return typeof data === 'string'
		? new URL(data).searchParams
		: data instanceof URL
			? data.searchParams
			: data;
};

export const parseURL = <
	S extends Schema,
	D extends Default<S> | undefined,
	Enforce extends boolean = false
>(
	data: string | URL | URLSearchParams | SvelteURLSearchParams,
	schema: S,
	defaultValue?: D
): SchemaOutput<S, D, Enforce> => {
	const searchParams = getSearchParams(data);
	const paths = Array.from(searchParams.entries());
	const result: any = {};
	const pathMap = new Map(paths);

	const parseSchemaRecursive = (
		currentSchema: any,
		currentResult: any,
		currentPath: string = '',
		defaultSchema: any
	) => {
		for (const [key, schemaType] of Object.entries(currentSchema)) {
			const newPath = currentPath ? `${currentPath}.${key}` : key;
			const defaultValue = defaultSchema?.[key];

			if (typeof schemaType === 'string') {
				// Handle primitive types
				const value = pathMap.get(newPath) || defaultValue;
				currentResult[key] =
					value !== undefined && value !== null
						? parsePrimitive(schemaType as Primitive, value)
						: null;
			} else if (Array.isArray(schemaType)) {
				// Handle array types
				currentResult[key] = [];
				const arraySchema = schemaType[0];

				for (let i = 0; ; i++) {
					const arrayPath = `${newPath}.${i}`;
					if (typeof arraySchema === 'string') {
						const value = pathMap.get(arrayPath);
						if (value === undefined) {
							if (defaultValue?.[i]) {
								currentResult[key][i] = defaultValue[i];
								continue;
							} else {
								// end the loop
								break;
							}
						}
						currentResult[key].push(parsePrimitive(arraySchema as Primitive, value));
					} else {
						if (!Array.from(pathMap.keys()).some((path) => path.startsWith(arrayPath))) break;
						currentResult[key][i] = {};
						parseSchemaRecursive(arraySchema, currentResult[key][i], arrayPath, defaultValue?.[i]);
					}
				}
			} else if (typeof schemaType === 'object') {
				// Handle nested object types
				currentResult[key] = {};
				parseSchemaRecursive(schemaType, currentResult[key], newPath, defaultValue);
			}
		}
	};

	parseSchemaRecursive(schema, result, '', defaultValue);
	return result;
};

export const isValidPath = (path: string, schema: Schema): boolean => {
	const parts = path.split('.');
	let currentSchema: any = schema;

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
