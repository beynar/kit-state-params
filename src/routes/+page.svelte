<script lang="ts">
	import { goto } from '$app/navigation';
	import { queryParams } from '$lib/index.svelte.js';

	let { data } = $props();

	$inspect(data);
	const params = queryParams({
		schema: {
			search: 'string',
			tags: ['number'],
			enums: ['<test,test2>'],
			enum: '<test,test2>',
			object: {
				object: {
					string: 'string'
				}
			}
		},
		default: {
			search: 'caca',
			enum: 'test2'
		}

		// enforceDefault: true
	});

	const tag = $state({ name: 'one', value: 2 });
	const object = $state({
		object: {
			string: 'hello'
		}
	});
</script>

{#snippet button(label: string, onclick: () => void)}
	<button
		type="button"
		class="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
		{onclick}
	>
		{label}
	</button>
{/snippet}
<div class="flex flex-col gap-4 p-10">
	<div class="max-w-full mx-auto mt-24">
		<div class="bg-gray-900 text-white p-4 rounded-md">
			<div class="overflow-x-visible">
				<pre id="code" class="text-gray-300"><code>{JSON.stringify(params, null, 2)}</code></pre>
			</div>
		</div>
	</div>

	<div class="flex gap-4 flex-wrap">
		{@render button('Reassign tags', () => {
			params.tags = [0, 1, 2];
		})}
		{@render button('Push a state', () => {
			params.tags.push(tag.value);
		})}
		{@render button('fitler tag', () => {
			params.tags = params.tags.filter((t) => t !== 2);
		})}
		{@render button('Push into enum', () => {
			params.enums.push('test2');
		})}
		{@render button('Assign object', () => {
			params.object = object;
		})}
		{@render button('Set nested property', () => {
			params.object.object.string = params.object.object.string + ' string';
		})}
		{@render button('Set enum', () => {
			params.enum = params.enum === 'test2' ? null : 'test2';
		})}
		{@render button('Push wrong enum', () => {
			params.enums.push('prout');
		})}
		{@render button('Reset', () => {
			params.$reset();
		})}
		{@render button('Reset to default', () => {
			params.$reset(true);
		})}

		<button
			onclick={() => {
				params.object.object.string = params.object.object.string + ' string';
			}}
		>
			Set nested : {params.object.object.string}
		</button>
		<button
			onclick={() => {
				params.$reset();
			}}
		>
			reset
		</button>
		<button
			onclick={() => {
				const search = new URLparams(window.location.search);
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

		<input bind:value={params.search} />
	</div>
</div>
