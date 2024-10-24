# kit-state-params

## 1. Introduction

kit-state-params is a lightweight query params state management library for SvelteKit that simplifies state management and URL synchronization. It provides a seamless way to keep your application state in sync with URL search parameters, enhancing user experience and enabling easy sharing of application states.

Key features:

- Works like a normal state in svelte 5 : reactive, mutable and without using the boxed value pattern.
- Automatic URL synchronization: State changes are reflected in the URL, making it easy to share and bookmark specific application states.
- Handles `string`, `number`, `date`, `boolean` and `enum` as primitives, arrays of primitives, arrays of objects and nested objects.
- Type safe and runtime safe: Define your state structure with a simple schema, ensuring type safety throughout your application.
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

## 3. Client Side

Create a state with the searchParams function. You need to pass a schema of the parameters you want to use. The type of the state will be infered from the schema.
The state is a like a normal state in svelte 5. It is reactive and you can mutate or update its properties.

Every mutation will be reflected in the url search params.
You can use the `debounce` option to customize the time between each update.

Each update will trigger a navigation by default but you can use the `shallow` option to prevent it.

You can use the `pushHistory` option to control if you want to push a new history entry or replace the current one. By default it will not push a new history entry.

The library will try its best to keep the url clean by removing empty strings, null values and so on.

### Basic usage

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

### Options

The `stateParams` function accepts an options object. Here's a table describing the available options:

| Name                  | Type                    | Description                                                                                                                                                                         | Default Value | Required | Example                                  |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- | ---------------------------------------- |
| schema                | [`Schema`](#schemas)    | Defines the structure and types of the URL parameters                                                                                                                               |               | `true`   | `{ search: 'string', tags: ["number"] }` |
| debounce              | `number`                | Time in milliseconds to wait before updating the URL after a state change                                                                                                           | `200`         | `false`  | `500`                                    |
| pushHistory           | `boolean`               | Whether to push a new history entry on state change                                                                                                                                 | `false`       | `false`  | `true`                                   |
| twoWayBinding         | `boolean`               | Enables synchronization between URL changes and state                                                                                                                               | `true`        | `false`  | `false`                                  |
| preserveUnknownParams | `boolean`               | Keeps URL parameters not defined in the schema                                                                                                                                      | `true`        | `false`  | `false`                                  |
| invalidateAll         | `boolean`               | Invalidates the state and re-fetches all load functions on state change                                                                                                             | `false`       | `false`  | `false`                                  |
| invalidate            | `(string / URL)`[]      | Other routes / load functions to invalidate on state change                                                                                                                         | `[]`          | `false`  | `["profile", "user"]`                    |
| shallow               | `boolean`               | If true, will not trigger a navigation and therefore not rerun the current load function                                                                                            | `false`       | `false`  | `true`                                   |
| default               | the type of your schema | The default value of the state. It will be used to initialize the state if no value is found in the url                                                                             | `undefined`   | `false`  | `{ search: 'hello', tags: [1, 2] }`      |
| enforceDefault        | `boolean`               | If true, will enforce the default value when a value is set to null or when the state is `$reset`. This led to removing `null` from the types of the values defined in your default | `false`       | `false`  | `true`                                   |

### Schema

> [!Note on schema, validation and coercion]
> The schema is not a validator per se. It will ensure that the type of the value is correct but it will also coerce the value to the correct type rather than throwing an error. For example, if the value is `"12"` and the type is `number`, it will be coerced to `12`. If the value can not be coerced, it will be set to `null`.
>
> This allows to never have invalid values in the state but also to preserve the schema structure.
>
> Therefore the validation will never throw an error while keeping your app safe from invalid values.
>
> I did that because of the nature of search params, they can be easily manipulated by users (that can lead to invalid values in the state) and they can also be stored and shared (they can be staled). In the event of a schema change I assumed that no one would want to throw an error or a 404 for a user just because he has an old url.
>
> At runtime, when modifying the state, the library will check if the value is of the correct type. If not, it will coerce it to the correct type. If it can not be coerced, it will prevent the update.

The schema is a simple object that defines the structure of the URL parameters. It is an object where the keys are the parameter names and the values are the types.

Primitive types are: `string`, `number`, `date`, `boolean` and `enum`.

You can define arrays of primitives and arrays of objects.

Objects can be nested and can be of any type.

#### Simple schema

```ts
const schema = {
	search: 'string',
	new: 'boolean',
	startDate: 'date',
	count: 'number',
	enum: '<blue,green,red>'
};
```

#### Schema with arrays and nested objects

```ts
const schema = {
	// Define an object with nested objects
	user: {
		language: '<en,fr,es>'
		name: 'string',
		address: {
			street: 'string',
			city: 'string',
			zip: 'string'
		}
	},
	// Define an array of strings (can be any other primitive: boolean, number, date)
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

#### Extras

the `stateParams` function returns a proxy reflecting the defined schema that also contains:

- a `$reset` function to clear the search params (it will also clear the unknown params in the url if you set `preserveUnknownParams` to `false`)
- a `$searchParams` property that is the underlying `SvelteURLSearchParams` reactive URLSearchParams

## 4. Server Side

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
		// search is of type string | null
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
