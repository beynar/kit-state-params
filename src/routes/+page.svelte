<script lang="ts">
	import { goto } from '$app/navigation';
	import { stateParams } from '$lib/index.svelte.js';
	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: ['number'],
			object: {
				object: {
					string: 'string'
				}
			}
		},
		preserveUnknownParams: false,
		twoWayBinding: false
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
				searchParams.tags.push(searchParams.tags.length + 1);
			}}
		>
			Add tag
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
				search.set('caca', 'prout');
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
	</div>
</div>
