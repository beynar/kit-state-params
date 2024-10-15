import type { Primitive, PrimitiveArray, Schema, SchemaOutput, SchemaType } from './types.js';

const safeParseArray = (value: string): any[] => {
	try {
		const maybeArray = JSON.parse(value);
		if (Array.isArray(maybeArray)) {
			return maybeArray;
		}
		return [];
	} catch (error) {
		return [];
	}
};

export const debounce = (fn: () => void, delay: number) => {
	let timeout: number;
	return () => {
		clearTimeout(timeout);
		timeout = setTimeout(fn, delay);
	};
};

export const stringify = (primitiveType: Primitive, value: any): string | null => {
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

export const stringifyArray = <T extends Schema>(
	key: keyof SchemaOutput<T>,
	value: any[],
	schema: T
) => {
	const schemaType = schema[key] as PrimitiveArray;
	const primitiveType = schemaType.split('[]')[0] as Primitive;
	const stringified = value
		.map((item) => {
			const stringifiedItem = stringify(primitiveType, item);
			// Handle mixed types
			if (item instanceof Date) {
				return item.toISOString();
			}
			return stringifiedItem;
		})
		.filter((v) => v !== null);
	if (stringified.length === 0) {
		return null;
	}
	return JSON.stringify(stringified);
};

export const parse = (primitiveType: Primitive, value: string) => {
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

export const parseURL = <T extends Schema>(url: URL | string, schema: T): SchemaOutput<T> => {
	const searchParams = typeof url === 'string' ? new URL(url).searchParams : url.searchParams;
	const output = {} as SchemaOutput<T>;

	const assign = (key: keyof T, value: any | null) => {
		Object.assign(output, {
			[key]: value
		});
	};
	const schemaEntries = Object.entries(schema) as [keyof T & string, SchemaType][];
	for (const [key, type] of schemaEntries) {
		const value = searchParams.get(key);
		if (!value) {
			assign(key, null);
			continue;
		}
		if (type.endsWith('[]')) {
			const [primitiveType] = (type as PrimitiveArray).split('[]') as [Primitive];
			const parsed = safeParseArray(value) as any[];
			assign(key, parsed.map((item) => parse(primitiveType, item)).filter(Boolean));
		} else {
			assign(key, parse(type as Primitive, value));
		}
	}
	return output;
};
