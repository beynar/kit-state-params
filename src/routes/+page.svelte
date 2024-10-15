<script lang="ts">
	import { stateParams } from '$lib/index.svelte.js';
	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: 'number[]'
		}
	});
</script>

{JSON.stringify(searchParams)}
<button
	onclick={() => {
		if (!searchParams.tags) {
			searchParams.tags = [];
		}
		searchParams.tags.push(searchParams.tags.length + 1);
	}}
>
	Add tag
</button>

<input bind:value={searchParams.search} />
