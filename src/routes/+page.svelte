<script lang="ts">
	import { goto } from '$app/navigation';
	import { stateParams } from '$lib/index.svelte.js';

	let { data } = $props();

	$inspect(data);
	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: ['number'],
			enum: ['<test,test2>'],
			object: {
				object: {
					string: 'string'
				}
			}
		},
		shallow: true
	});
</script>

<div style="display: flex; flex-direction: column; gap: 1rem">
	<code style="width: 100%">
		{JSON.stringify(searchParams.$searchParams.toString())}
	</code>
	<code style="width: 100%">
		{JSON.stringify(searchParams)}
	</code>

	<div>
		<button
			onclick={() => {
				searchParams.tags.push('0');
			}}
		>
			Add tag
		</button>
		<button
			onclick={() => {
				searchParams.enum.push('test2');
			}}
		>
			set enum {searchParams.enum}
		</button>
		<button
			onclick={() => {
				searchParams.enum.push('prout');
			}}
		>
			set wrong enum {searchParams.enum}
		</button>
		<button
			onclick={() => {
				searchParams.object.object.string = searchParams.object.object.string + ' string';
			}}
		>
			Set nested : {searchParams.object.object.string}
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
				search.set('search', 'prout');
				goto(`?${search.toString()}`, {
					keepFocus: true,
					noScroll: true,
					replaceState: true,
					invalidateAll: true
				});
			}}
		>
			Go to
		</button>

		<input bind:value={searchParams.search} />
	</div>
</div>
