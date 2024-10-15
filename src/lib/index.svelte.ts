import { onMount } from 'svelte';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import type { Opts, Primitive, PrimitiveArray, Schema, SchemaOutput } from './types.js';
import { debounce, parseURL, stringify, stringifyArray } from './utils.js';

export const stateParams = <T extends Schema>(opts: Opts<T>) => {
	const url = get(page).url;
	let current = $state<SchemaOutput<T>>(parseURL(url, opts.schema));
	let searchParams = new SvelteURLSearchParams(url.search);

	const cleanUnknownParams = () => {
		if (opts.preserveUnknownParams === false) {
			searchParams.forEach((_, key) => {
				if (!(key in opts.schema)) {
					searchParams.delete(key);
				}
			});
		}
	};

	cleanUnknownParams();

	onMount(() => {
		if (opts.twoWayBinding !== false) {
			// Sync the search params and the state with changes that occurs outside of a state mutation
			const handleURLChange = () => {
				const newSearchParams = new URLSearchParams(window.location.search);
				if (newSearchParams.toString() !== searchParams.toString()) {
					const newUrl = new URL(window.location.href);
					const newState = parseURL(newUrl, opts.schema);
					for (const key in opts.schema) {
						const value = opts.schema[key];
						if (key in newState) {
							current[key] = newState[key];
							searchParams.set(key, newUrl.searchParams.get(key) as string);
						} else {
							searchParams.delete(key);
							const isArray = value.endsWith('[]');
							Object.assign(current, {
								[key]: isArray ? [] : null
							});
						}
						searchParams.forEach((_, key) => {
							if (opts.preserveUnknownParams === false) {
								if (!(key in opts.schema)) {
									searchParams.delete(key);
								}
							}
							console.log(searchParams.get(key), key);
							if (searchParams.get(key) === 'null') {
								searchParams.delete(key);
							}
						});
					}
				}
			};

			page.subscribe(handleURLChange);
		}
	});

	const updateLocation = debounce(() => {
		cleanUnknownParams();
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

	const reset = () => {
		for (const key in opts.schema) {
			const value = opts.schema[key];
			searchParams.delete(key);
			const isArray = value.endsWith('[]');
			Object.assign(current, {
				[key]: isArray ? [] : null
			});
		}
		updateLocation();
	};

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
			if (key === '$reset') {
				return reset;
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

	return new Proxy(current, handler) as SchemaOutput<T> & {
		$searchParams: SvelteURLSearchParams;
		$reset: () => void;
	};
};
