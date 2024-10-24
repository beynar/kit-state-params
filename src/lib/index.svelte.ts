import { SvelteURLSearchParams } from 'svelte/reactivity';
import { get } from 'svelte/store';
import {
	goto,
	invalidate,
	afterNavigate,
	pushState,
	replaceState,
	invalidateAll as _invalidateAll
} from '$app/navigation';
import { page } from '$app/stores';
import type { Default, Opts, Schema, SchemaOutput } from './types.js';
import { debounce, isValidPath, parseURL } from './utils.js';
import { createProxy } from './proxy.js';
import { building } from '$app/environment';
import { coerceObject } from './coerce.js';

export const stateParams = <
	T extends Schema,
	D extends Default<T> | undefined,
	Enforce extends boolean = false
>({
	schema,
	default: _defaultValue,
	enforceDefault,
	debounce: debounceTime = 200,
	preserveUnknownParams = true,
	pushHistory = false,
	invalidateAll = false,
	twoWayBinding = true,
	invalidate: invalidations = [],
	shallow = false
}: Opts<T, D, Enforce>) => {
	const defaultValue = _defaultValue ? coerceObject(schema, _defaultValue) : undefined;
	const url = building ? new URL('https://github.com/beynar/kit-state-params') : get(page).url;
	let current = $state<SchemaOutput<T, D, Enforce>>(
		parseURL<T, D, Enforce>(url, schema, defaultValue as D)
	);
	let searchParams = new SvelteURLSearchParams(url.search);

	const cleanUnknownParams = () => {
		if (preserveUnknownParams) return;
		Array.from(searchParams.keys()).forEach((key) => {
			if (!isValidPath(key, schema)) {
				searchParams.delete(key);
			}
		});
	};

	cleanUnknownParams();

	// Sync the search params and the state with changes that occurs outside of a state mutation
	twoWayBinding &&
		afterNavigate(async ({ complete, to, delta }) => {
			if (!to) return;
			await complete;

			const newSearchParams = new URLSearchParams(to.url.search);
			if (newSearchParams.toString() !== searchParams.toString()) {
				let hasChanged = false;
				Array.from(newSearchParams.keys()).forEach((key) => {
					const isValid = isValidPath(key, schema);
					if (!isValid && !preserveUnknownParams) {
						// Remove unknown params
						newSearchParams.delete(key);
					} else if (searchParams.get(key) !== newSearchParams.get(key)) {
						// Assign changed params if they are not already in the search params
						searchParams.set(key, newSearchParams.get(key)!);
						if (isValid) {
							hasChanged = true;
						}
					}
				});
				// Clean up remaining search params
				Array.from(searchParams.keys()).forEach((key) => {
					if (!newSearchParams.has(key)) {
						searchParams.delete(key);
						if (isValidPath(key, schema)) {
							hasChanged = true;
						}
					}
				});
				// Update the state if the search params have changed
				hasChanged && Object.assign(current, parseURL(newSearchParams, schema));
			}
		});

	const updateLocation = debounce(() => {
		cleanUnknownParams();
		const query = searchParams.toString();
		const hash = window.location.hash;
		const currentSearchParams = new URLSearchParams(window.location.search);
		if (query !== currentSearchParams.toString()) {
			if (shallow) {
				(pushHistory ? pushState : replaceState)(`?${query}${hash}`, {});
				if (invalidateAll) {
					_invalidateAll();
				}
			} else {
				goto(`?${query}${hash}`, {
					keepFocus: true,
					noScroll: true,
					replaceState: !pushHistory,
					invalidateAll
				});
			}

			invalidations.forEach(invalidate);
		}
	}, debounceTime);

	const reset = (_enforceDefault = enforceDefault) => {
		Array.from(searchParams.keys()).forEach((key) => {
			const isValid = isValidPath(key, schema);
			if (isValid || (!isValid && !preserveUnknownParams)) {
				searchParams.delete(key);
			}
		});
		Object.assign(
			current,
			parseURL(searchParams, schema, _enforceDefault ? defaultValue : undefined)
		);
		updateLocation();
	};

	const updateSearchParams = (key: string, stringified: string | null) => {
		if (stringified === null || stringified === '') {
			searchParams.delete(key);
		} else if (searchParams.get(key) !== stringified) {
			searchParams.set(key, stringified);
		}
		updateLocation();
	};

	return createProxy<T, D, Enforce>(current, {
		schema,
		onUpdate: updateSearchParams,
		clearPaths: (path) => {
			Array.from(searchParams.keys()).forEach((key) => {
				if (key.startsWith(path)) {
					searchParams.delete(key);
				}
			});
			updateLocation();
		},
		default: defaultValue,
		enforceDefault,
		searchParams,
		reset
	});
};
