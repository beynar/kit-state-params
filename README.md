# kit-state-params

## 1. Introduction

kit-state-params is a lightweight query params state management library for SvelteKit that simplifies state management and URL synchronization. It provides a seamless way to keep your application state in sync with URL search parameters, enhancing user experience and enabling easy sharing of application states.

Key features:

- Works like a normal state in svelte 5 (reactive and mutable)
- Automatic URL synchronization: State changes are reflected in the URL, making it easy to share and bookmark specific application states.
- Type safe and runtime safe: Define your state structure with a simple schema, ensuring type safety throughout your application.
- Handles arrays of primitives, arrays of objects and nested objects.
- Reactive state management: Utilizes Svelte's reactive state system for efficient updates and rendering.
- Customizable debounce: Control the frequency of URL updates to optimize performance.
- History management: Choose between pushing new history entries or replacing the current one.
- Clean URL handling: Automatically removes empty values from the URL to keep it tidy.
- Can preserve unknown params (not defined in the schema).

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
You can use the `pushHistory` option to control if you want to push a new history entry or replace the current one. By default it will not push a new history entry.

The library will try its best to keep the url clean by removing empty arrays, empty strings, null values and so on.

```svelte
<script lang="ts">
	import { stateParams } from 'kit-state-params';

	const searchParams = stateParams({
		schema: {
			search: 'string',
			tags: ['number']
		}
	});
</script>

<button
	onclick={() => {
		searchParams.tags.push(searchParams.tags.length + 1);
	}}
>
	Add tag
</button>

<input bind:value={searchParams.search} />

{JSON.stringify(searchParams)}
```

### Schemas

The schema is a simple object that defines the structure of the URL parameters. It is an object where the keys are the parameter names and the values are the types.

#### Simple schema

```ts
const schema = {
	search: 'string',
	new: 'boolean',
	startDate: 'date',
	count: 'number'
};
```

#### Schema with arrays and nested objects

```ts
const schema = {
	// Define an object with nested objects
	user: {
		name: 'string',
		address: {
			street: 'string',
			city: 'string',
			zip: 'string'
		}
	},
	// Define an array of strings (can be any other primitive: boolean, number, date, etc.)
	tags: ['string'],
	// Define an array of objects (objects inside arrays can also be nested)
	friends: [
		{
			name: 'string',
			age: 'number'
		}
	]
};
```

### Options

The `stateParams` function accepts an options object. Here's a table describing the available options:

| Name                  | Type      | Description                                                               | Default Value | Required | Example                                  |
| --------------------- | --------- | ------------------------------------------------------------------------- | ------------- | -------- | ---------------------------------------- |
| schema                | `Schema`  | Defines the structure and types of the URL parameters                     |               | `true`   | `{ search: 'string', tags: ["number"] }` |
| debounce              | `number`  | Time in milliseconds to wait before updating the URL after a state change | `200`         | `false`  | `500`                                    |
| pushHistory           | `boolean` | Whether to push a new history entry on state change                       | `false`       | `false`  | `true`                                   |
| twoWayBinding         | `boolean` | Enables synchronization between URL changes and state                     | `true`        | `false`  | `false`                                  |
| preserveUnknownParams | `boolean` | Keeps URL parameters not defined in the schema                            | `true`        | `false`  | `false`                                  |

### Server Side

kit-state-params also exports a `parseURL` function. This function can be used to parse the URL parameters into a typed object. It can be usefull inside the `load` function of a route.

```ts
import { parseURL } from 'kit-state-params';
export const load = ({ url }) => {
	const searchParams = parseURL(url, {
		search: 'string',
		tags: ['number']
	});
	const result = await api.getCustomers({
		search: searchParams.search,
		// search is of type string
		tags: searchParams.tags
		// tags is of type number[]
	});
	return {
		result
	};
};
```

## License

This project is licensed under the MIT License.
This README provides a comprehensive introduction to your library, installation instructions, and usage examples covering the main functionalities. It also includes sections on advanced usage and error handling. You may want to adjust the project name, installation instructions, and license information to match your specific project details.
