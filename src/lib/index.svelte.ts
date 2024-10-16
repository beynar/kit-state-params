import { onMount } from 'svelte';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import type { Opts, Schema, SchemaOutput } from './types.js';
import { debounce, isValidPath, parseURL } from './utils.js';
import { createProxy } from './proxy.js';

export const stateParams = <T extends Schema>({
	schema,
	debounce: debounceTime = 200,
	preserveUnknownParams = true,
	pushHistory = false,
	twoWayBinding = true
}: Opts<T>) => {
	const url = get(page).url;
	let current = $state<SchemaOutput<T>>(parseURL(url, schema));
	let searchParams = new SvelteURLSearchParams(url.search);

	const cleanUnknownParams = (sp = searchParams) => {
		if (preserveUnknownParams) return;
		Array.from(searchParams.keys()).forEach((key) => {
			if (!isValidPath(key, schema)) {
				searchParams.delete(key);
			}
		});
	};

	cleanUnknownParams();

	onMount(() => {
		if (!twoWayBinding) return;
		// Sync the search params and the state with changes that occurs outside of a state mutation
		const bind = () => {
			const newSearchParams = new URLSearchParams(window.location.search);
			if (newSearchParams.toString() !== searchParams.toString()) {
				Object.assign(current, parseURL(newSearchParams, schema));
				Array.from(newSearchParams.keys()).forEach((key) => {
					const isValid = isValidPath(key, schema);
					if (!isValid && !preserveUnknownParams) {
						newSearchParams.delete(key);
					} else if (searchParams.get(key) !== newSearchParams.get(key)) {
						searchParams.set(key, newSearchParams.get(key)!);
					}
				});
				Array.from(searchParams.keys()).forEach((key) => {
					if (!newSearchParams.has(key)) {
						searchParams.delete(key);
					}
				});
			}
		};

		page.subscribe(bind);
	});

	const updateLocation = debounce(() => {
		cleanUnknownParams();
		const query = searchParams.toString();

		const currentSearchParams = new URLSearchParams(window.location.search);
		if (query !== currentSearchParams.toString()) {
			goto(`?${query}`, {
				keepFocus: true,
				noScroll: true,
				replaceState: !pushHistory
			});
		}
	}, debounceTime || 200);

	const reset = () => {
		Array.from(searchParams.keys()).forEach((key) => {
			const isValid = isValidPath(key, schema);
			if (isValid || (!isValid && !preserveUnknownParams)) {
				searchParams.delete(key);
			}
		});

		Object.assign(current, parseURL(searchParams, schema));
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

	// I do not fully understand this, but it seems to works 🫡
	return createProxy(current, {
		schema: schema,
		onUpdate: updateSearchParams,
		searchParams,
		reset
	});
};
