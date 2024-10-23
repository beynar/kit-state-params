import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Default, Primitive, Schema, SchemaOutput, Simplify } from './types.js';
import { parsePrimitive, parseURL, stringifyPrimitive } from '$lib/utils.js';

export const createProxy = <
	T extends Schema,
	D extends Default<T> | undefined,
	Enforce extends boolean = false
>(
	obj: any,
	{
		schema,
		onUpdate,
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
						Array.prototype[key as keyof typeof Array.prototype].apply(this, args);
					};
				}
			}

			if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
				return createProxy(value, {
					schema: schema[key as keyof T] as Schema,
					onUpdate,
					searchParams,
					reset,
					path: path ? `${path}.${key}` : key,
					array: Array.isArray(value) ? value : undefined,
					default: defaultValue?.[key as keyof T]
				});
			}
			return value;
		},
		set(target: SchemaOutput<T>, prop: string, value: any, receiver: any) {
			console.log('set', target, prop, value, receiver);
			const isArrayTargeted = Array.isArray(target);
			if (!(prop === 'length' && isArrayTargeted)) {
				const primitive = (schema[prop] || schema[0]) as Primitive;
				if (Array.isArray(primitive) && Array.isArray(value)) {
					const parsed = value.map((v) => {
						parsePrimitive(primitive[0], v, enforceDefault && defaultValue?.[prop]);
					});
					Reflect.set(target, prop, parsed);
					value.forEach((v, i) => {
						onUpdate(
							path ? `${path}.${prop}.${i}` : `${prop}.${i}`,
							stringifyPrimitive(primitive[0], v)
						);
					});
				} else {
					const parsed = parsePrimitive(primitive, value, enforceDefault && defaultValue?.[prop]);
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

	return new Proxy(obj, handler) as Simplify<SchemaOutput<T, D, Enforce>> & {
		$searchParams: SvelteURLSearchParams;
		$reset: (enforceDefault?: boolean) => void;
	};
};
