import type { Opts, Primitive, PrimitiveArray, Schema, SchemaOutput } from './types.js';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { debounce, parseURL, stringify, stringifyArray } from './utils.js';

export const stateParams = <T extends Schema>(opts: Opts<T>) => {
	const url = get(page).url;
	let current = $state<SchemaOutput<T>>(parseURL(url, opts.schema));
	let searchParams = new SvelteURLSearchParams(url.search);

	const updateLocation = debounce(() => {
		const query = searchParams.toString();
		if (typeof window !== 'undefined') {
			const currentSearchParams = new URLSearchParams(window.location.search);
			if (query !== currentSearchParams.toString()) {
				goto(`?${query}`, {
					keepFocus: true,
					noScroll: true,
					replaceState: !opts.pushHistory
				});
			}
		}
	}, opts.debounce || 200);

	const updateSearchParams = (key: keyof SchemaOutput<T>, stringified: string | null) => {
		if (stringified === null || stringified === '') {
			searchParams.delete(key as string);
		} else {
			if (searchParams.get(key as string) !== stringified) {
				searchParams.set(key as string, stringified);
			}
		}
		updateLocation();
	};

	// I do not fully understand this, but it seems to works 🫡
	const handler: ProxyHandler<SchemaOutput<T>> = {
		get(target: SchemaOutput<T>, key: string) {
			if (key === '$searchParams') {
				return searchParams;
			}
			const value = Reflect.get(target, key);
			if (Array.isArray(value)) {
				return new Proxy(value, {
					get(arr: any[], prop: string) {
						if (
							typeof prop === 'string' &&
							['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(prop)
						) {
							return function (this: any[], ...args: any[]) {
								const result = Array.prototype[prop as keyof typeof Array.prototype].apply(
									this,
									args
								);
								handler?.set?.(target, key, arr, result);
								return result;
							};
						}

						return Reflect.get(arr, prop);
					}
				});
			}
			return value;
		},
		set(target: SchemaOutput<T>, prop: string, value: any) {
			Reflect.set(target, prop, value);
			const schemaType = opts.schema[prop as keyof T] as Primitive | PrimitiveArray;
			if (schemaType.endsWith('[]')) {
				updateSearchParams(prop, stringifyArray(prop, value, opts.schema));
			} else {
				updateSearchParams(prop, stringify(schemaType as Primitive, value));
			}
			return true;
		}
	};

	return new Proxy(current, handler) as SchemaOutput<T> & { $searchParams: SvelteURLSearchParams };
};
