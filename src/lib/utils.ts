import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Primitive, Schema } from './types.js';

export const debounce = (fn: () => void, delay: number) => {
	let timeout: number;
	return () => {
		clearTimeout(timeout);
		timeout = setTimeout(fn, delay);
	};
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
	}
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
			return value && typeof value === 'string'
				? value.toLowerCase() === 'true'
					? true
					: value.toLowerCase() === 'false'
						? false
						: null
				: null;
		}
	}
};

export const parseURL = (
	data: string | URL | URLSearchParams | SvelteURLSearchParams,
	schema: Schema
): any => {
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
			const newPath = currentPath ? `${currentPath}.${key}` : key;

			if (typeof schemaType === 'string') {
				// Handle primitive types
				const value = pathMap.get(newPath);
				currentResult[key] = value ? parsePrimitive(schemaType as Primitive, value) : null;
			} else if (Array.isArray(schemaType)) {
				// Handle array types
				currentResult[key] = [];
				const arraySchema = schemaType[0];

				for (let i = 0; ; i++) {
					const arrayPath = `${newPath}.${i}`;
					if (typeof arraySchema === 'string') {
						const value = pathMap.get(arrayPath);
						if (value === undefined) break;
						currentResult[key].push(parsePrimitive(arraySchema as Primitive, value));
					} else {
						if (!Array.from(pathMap.keys()).some((path) => path.startsWith(arrayPath))) break;
						currentResult[key][i] = {};
						parseSchemaRecursive(arraySchema, currentResult[key][i], arrayPath);
					}
				}
			} else if (typeof schemaType === 'object') {
				// Handle nested object types
				currentResult[key] = {};
				parseSchemaRecursive(schemaType, currentResult[key], newPath);
			}
		}
	};

	parseSchemaRecursive(schema, result);
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
