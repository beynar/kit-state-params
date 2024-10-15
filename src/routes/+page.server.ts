import { parseURL } from '$lib/index.js';

export const load = async ({ url }: { url: URL }) => {
	const searchParams = parseURL(url, {
		search: 'string',
		tags: 'number[]'
	});

	return {
		searchParams
	};
};
