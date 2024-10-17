import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Primitive, Schema, SchemaOutput, ZodObject, ZodSchema } from './types.js';
import { parsePrimitive, shape, stringifyPrimitive, toString } from '$lib/utils.js';

// export const getTypedSchema = <T extends Schema>(schema: T, key: string) => {
// 	if ('safeParse' in schema && 'shape' in schema) {
// 		return (schema as ZodObject).shape[key];
// 		schema._def
// 	}
// 	return schema[key as keyof T];
// };
export const createProxy = <T extends Schema>(
	obj: any,
	{
		zodMode,
		schema,
		onUpdate,
		searchParams,
		reset,
		path = '',
		array
	}: {
		zodMode?: boolean;
		schema: T;
		onUpdate: (path: string, value: any) => void;
		searchParams: SvelteURLSearchParams | URLSearchParams;
		reset: () => void;
		path?: string;
		array?: any[];
	}
) => {
	const handler: ProxyHandler<SchemaOutput<T>> = {
		get(target: SchemaOutput<T>, key: string) {
			if (key === '$searchParams') {
				return searchParams;
			}

			if (key === '$reset') {
				return reset;
			}

			const value = Reflect.get(target, key);

			if (array) {
				if (
					typeof key === 'string' &&
					['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(key)
				) {
					return function (this: any[], ...args: any[]) {
						Array.prototype[key as keyof typeof Array.prototype].apply(this, args);
					};
				}
			}

			if (typeof value === 'object' && value !== null && !((value as any) instanceof Date)) {
				return createProxy(value, {
					zodMode,
					schema: shape(schema)[key],
					onUpdate,
					searchParams,
					reset,
					path: path ? `${path}.${key}` : key,
					array: Array.isArray(value) ? value : undefined
				});
			}
			return value;
		},
		set(target: SchemaOutput<T>, prop: keyof T & string, value: any) {
			const isArrayTargeted = Array.isArray(target);
			if (!(prop === 'length' && isArrayTargeted)) {
				if (zodMode) {
					const parsed = ((schema as ZodObject).shape[prop] as ZodSchema).safeParse(value);
					if (parsed.success) {
						// validate as zodSchema
						Reflect.set(target, prop, parsed.data);
						onUpdate(path ? `${path}.${prop}` : prop, toString(parsed.data));
					}
				} else {
					const primitive = (schema[prop] || (schema as any)[0]) as Primitive;
					const parsed = parsePrimitive(primitive, value);
					const isValid = isArrayTargeted ? parsed !== null : true;
					if (isValid) {
						Reflect.set(target, prop, parsed);
						onUpdate(path ? `${path}.${prop}` : prop, stringifyPrimitive(primitive, value));
					}
				}
			}
			return true;
		}
	};

	return new Proxy(obj, handler) as (T extends ZodSchema ? SchemaOutput<T> : SchemaOutput<T>) & {
		$searchParams: SvelteURLSearchParams;
		$reset: () => void;
	};

	// return new Proxy(obj, handler) as Simplify<
	// 	SchemaOutput<T> & {
	// 		$searchParams: SvelteURLSearchParams;
	// 		$reset: () => void;
	// 	}
	// >;
};
