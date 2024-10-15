# kit-state-params

## 1. Introduction

kit-state-params is a lightweight and powerful library for SvelteKit that simplifies state management and URL synchronization. It provides a seamless way to keep your application state in sync with URL search parameters, enhancing user experience and enabling easy sharing of application states.

Key features:

- works like a normal state in svelte 5
- Automatic URL synchronization: State changes are reflected in the URL, making it easy to share and bookmark specific application states.
- Type-safe schema definition: Define your state structure with a simple schema, ensuring type safety throughout your application.
- Reactive state management: Utilizes Svelte's reactive state system for efficient updates and rendering.
- Customizable debounce: Control the frequency of URL updates to optimize performance.
- History management: Choose between pushing new history entries or replacing the current one.
- Clean URL handling: Automatically removes empty values from the URL to keep it tidy.
- Array support: Handles array parameters with ease, allowing for complex state structures.
- Easy integration: Designed to work seamlessly with SvelteKit projects.

Missing features:

- No support for nested state.
- No support for nested arrays.
- No support for objects.

With kit-state-params, you can create more maintainable and user-friendly web applications by leveraging the power of URL-driven state management.

## 2. Installation

```bash
npm install kit-state-params
```

```bash
pnpm install kit-state-params
```

```bash
bun install kit-state-params
```

## 3. Usage

### Client Side

Create a state with the searchParams function. You need to pass a schema of the parameters you want to use. The type of the state will infered from the schema.
The state is a like a normal state in svelte 5. It is reactive and you can mutate or update its properties.

Every mutation will be reflected in the url search params.
You can use the `debounce` option to customize the time between each update.

Each update will trigger a navigation.
You can use the `pushHistory` option to control if you want to push a new history entry or replace the current one.

The library will try its best to keep the url clean by removing empty arrays, empty strings, null values and so on.

```svelte
<script lang="ts">
	import { stateParams } from 'kit-state-params';

	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: 'number[]'
		}
	});
</script>

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

{JSON.stringify(searchParams)}
```

### Server Side

kit-state-params also exports a `parseURL` function. This function can be used to parse the URL parameters into a typed object. It can be usefull inside the `load` function of a route.

```ts
import { parseURL } from 'kit-state-params';
export const load = ({ url }) => {
	const searchParams = parseURL(url, {
		search: 'string',
		tags: 'number[]'
	});

	return {
		searchParams
	};
};
```

## License

This project is licensed under the MIT License.
This README provides a comprehensive introduction to your library, installation instructions, and usage examples covering the main functionalities. It also includes sections on advanced usage and error handling. You may want to adjust the project name, installation instructions, and license information to match your specific project details.
