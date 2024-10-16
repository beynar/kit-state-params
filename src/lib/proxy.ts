import type { SvelteURLSearchParams } from 'svelte/reactivity';
import type { Primitive, Schema, SchemaOutput } from './types.js';
import { stringifyPrimitive } from '$lib/utils.js';

export const createProxy = <T extends Schema>(
	obj: any,
	{
		schema,
		onUpdate,
		searchParams,
		reset,
		path = '',
		array
	}: {
		schema: T;
		onUpdate: (path: string, value: any) => void;
		searchParams: SvelteURLSearchParams | URLSearchParams;
		reset: () => void;
		path?: string;
		array?: any[];
	}
): SchemaOutput<T> & {
	$searchParams: SvelteURLSearchParams;
	$reset: () => void;
} => {
	const handler: ProxyHandler<SchemaOutput<T>> = {
		get(target: SchemaOutput<T>, key: string) {
			if (key === '$searchParams') {
				return searchParams;
			}
			if (key === '$reset') {
				return reset;
			}

			const value = Reflect.get(target, key);
			const newPath = path ? `${path}.${key}` : key;

			if (array) {
				if (
					typeof key === 'string' &&
					['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(key)
				) {
					return function (this: any[], ...args: any[]) {
						Array.prototype[key as keyof typeof Array.prototype].apply(this, args);
						return this;
					};
				}
			}

			if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
				return createProxy(value, {
					// schema: Array.isArray(schema) ? schema[0] : (schema[key as keyof T] as Schema),
					schema: schema[key as keyof T] as Schema,
					onUpdate,
					searchParams,
					reset,
					path: newPath,
					array: Array.isArray(value) ? value : undefined
				});
			}

			return value;
		},
		set(target: SchemaOutput<T>, prop: string, value: any) {
			Reflect.set(target, prop, value);

			const isArrayUpdateLength = prop === 'length' && Array.isArray(target);
			if (!isArrayUpdateLength) {
				const primitive = (schema[prop] || schema[0]) as Primitive;
				const newPath = path ? `${path}.${prop}` : prop;
				onUpdate(newPath, stringifyPrimitive(primitive, value));
			}

			return true;
		}
	};

	return new Proxy(obj, handler) as SchemaOutput<T> & {
		$searchParams: SvelteURLSearchParams;
		$reset: () => void;
	};
};
