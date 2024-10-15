<script lang="ts">
	import { goto } from '$app/navigation';
	import { stateParams } from '$lib/index.svelte.js';
	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: 'number[]'
		},
		preserveUnknownParams: false
	});
</script>

{JSON.stringify(searchParams.$searchParams.toString())}
{JSON.stringify(searchParams)}
<button
	onclick={() => {
		searchParams.tags.push(searchParams.tags.length + 1);
	}}
>
	Add tag
</button>
<button
	onclick={() => {
		searchParams.$reset();
	}}
>
	reset
</button>
<button
	onclick={() => {
		const search = new URLSearchParams(window.location.search);
		search.set('search', 'new search');
		goto(`?${search.toString()}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}}
>
	Go to
</button>

<input bind:value={searchParams.search} />
