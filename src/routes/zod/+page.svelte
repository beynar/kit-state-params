<script lang="ts">
	import { z } from 'zod';
	import { goto } from '$app/navigation';
	import { stateParams } from '$lib/index.svelte.js';
	const schema = z.object({
		search: z.string().optional().nullable(),
		tag: z.enum(['test1', 'test2']).nullable().catch('test1').default('test1'),
		tags: z.array(z.number()).default([]),
		enum: z.enum(['test', 'test2']).default('test'),
		object: z.object({
			object: z.object({
				string: z.coerce.string().nullable()
			})
		})
	});

	const searchParams = stateParams({
		schema,
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
				searchParams.tag = 'test1';
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
