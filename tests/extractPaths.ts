// This is not usefull right now, but it could be
import type { Primitive, Schema } from '$lib/types.js';
import { stringifyPrimitive } from '$lib/utils.js';

export const toSearchParams = (obj: any, schema: Schema) => {
	const searchParams = new URLSearchParams();
	const paths = extractPaths(obj, schema);
	paths.forEach(([key, value]) => searchParams.set(key, value));
	return searchParams;
};

export const extractPaths = (obj: any, schema: Schema, prefix = ''): [string, string][] => {
	const paths: [string, string][] = [];

	for (const [key, schemaType] of Object.entries(schema)) {
		const newPrefix = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];

		if (typeof schemaType === 'string') {
			// Handle primitive types
			const stringifiedValue = stringifyPrimitive(schemaType as Primitive, value);
			paths.push([newPrefix, stringifiedValue ?? '[null]']);
		} else if (Array.isArray(schemaType)) {
			// Handle array types
			if (!Array.isArray(value) || value.length === 0) {
				paths.push([newPrefix, '[array]']);
			} else {
				value.forEach((item, index) => {
					const itemSchema = schemaType[0];
					if (typeof itemSchema === 'object') {
						const nestedPaths = extractPaths(item, itemSchema, `${newPrefix}.${index}`);
						paths.push(...nestedPaths);
					} else {
						const stringifiedValue = stringifyPrimitive(itemSchema as Primitive, item);
						paths.push([`${newPrefix}.${index}`, stringifiedValue ?? '[null]']);
					}
				});
			}
		} else if (typeof schemaType === 'object') {
			// Handle nested object types
			if (typeof value !== 'object' || value === null) {
				paths.push([newPrefix, '[object]']);
			} else {
				const nestedPaths = extractPaths(value, schemaType, newPrefix);
				paths.push(...nestedPaths);
			}
		}
	}

	return paths;
};
