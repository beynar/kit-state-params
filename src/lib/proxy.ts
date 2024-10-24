import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Default, Schema, SchemaOutput, Simplify } from './types.js';
import { stringifyPrimitive, isPrimitive } from '$lib/utils.js';
import { traverseSchema } from './traverse.js';
import { coerceArray, coerceObject, coercePrimitive, coercePrimitiveArray } from './coerce.js';

export const createProxy = <
	T extends Schema,
	D extends Default<T> | undefined,
	Enforce extends boolean = false
>(
	obj: any,
	{
		schema,
		onUpdate,
		clearPaths = () => {},
		searchParams,
		reset,
		path = '',
		array,
		default: defaultValue,
		enforceDefault
	}: {
		schema: T;
		enforceDefault?: boolean;
		onUpdate: (path: string, value: any) => void;
		clearPaths?: (path: string) => void;
		searchParams: SvelteURLSearchParams | URLSearchParams;
		reset: () => void;
		path?: string;
		array?: any[];
		default?: any;
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
						const result = Array.prototype[key as keyof typeof Array.prototype].apply(this, args);

						// Handle array length changes
						if (key === 'pop' || key === 'shift') {
							const index = this.length;
							clearPaths(`${path}.${index - 1}`);
							Reflect.set(target, 'length', index - 1);
						}
						return result;
					};
				}
			}

			if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
				return createProxy(value, {
					schema: schema?.[key as keyof T] as Schema,
					onUpdate,
					searchParams,
					clearPaths,
					reset,
					path: path ? `${path}.${key}` : key,
					array: Array.isArray(value) ? value : undefined,
					default: defaultValue?.[key as keyof T]
				});
			}
			return value;
		},
		set(target: SchemaOutput<T>, prop: string, value: any) {
			const isArrayTargeted = Array.isArray(target);
			const isLengthTargeted = isArrayTargeted && prop === 'length';
			const schemaType = isArrayTargeted ? schema[0] : schema[prop];
			const isArray = Array.isArray(schemaType);
			const type = isArray ? schemaType[0] : schemaType;
			const primitive = isPrimitive(type) ? type : undefined;
			const objectSchema = isPrimitive(type) ? undefined : type;
			const basePath = path ? `${path}.${prop}` : prop;
			if (isLengthTargeted) {
				return true;
			}
			// TODO when reassining array or object we should cleanup all previous paths
			if (objectSchema) {
				if (isArray || isLengthTargeted) {
					const parsed = coerceArray(objectSchema, value, enforceDefault && defaultValue?.[prop]);

					// clearPaths(`${basePath}`);
					parsed.forEach((v, i) => {
						traverseSchema({
							schema: objectSchema,
							follower: v,
							cb: ({ path, primitive, follower }) => {
								onUpdate(`${basePath}.${i}.${path}`, stringifyPrimitive(primitive, follower));
							}
						});
					});

					Reflect.set(target, prop, parsed);
				} else {
					const parsed = coerceObject(objectSchema, value, enforceDefault && defaultValue?.[prop]);
					clearPaths(`${basePath}`);
					traverseSchema({
						schema: objectSchema,
						follower: parsed,
						cb: ({ path, primitive, follower }) => {
							onUpdate(`${basePath}.${path}`, stringifyPrimitive(primitive, follower));
						}
					});
					Reflect.set(target, prop, parsed);
				}
			} else if (primitive) {
				if (isArray) {
					const parsed = coercePrimitiveArray(
						primitive,
						value,
						enforceDefault && defaultValue?.[prop]
					);
					clearPaths(`${basePath}`);
					parsed.forEach((v, i) => {
						onUpdate(`${basePath}.${i}`, stringifyPrimitive(primitive, v));
					});

					Reflect.set(target, prop, parsed);
				} else {
					const parsed = coercePrimitive(primitive, value, enforceDefault && defaultValue?.[prop]);
					console.log('parsed', prop, primitive, parsed);
					if (parsed === null && !isNaN(Number(prop))) {
						// we avoid pushing null values to the array
						return true;
					}
					onUpdate(basePath, stringifyPrimitive(primitive, parsed));
					Reflect.set(target, prop, parsed);
				}
			}
			return true;
		}
	};

	return new Proxy(obj, handler) as Simplify<SchemaOutput<T, D, Enforce>> & {
		$searchParams: SvelteURLSearchParams;
		$reset: (enforceDefault?: boolean) => void;
	};
};
