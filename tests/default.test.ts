import type { Default, Schema } from '$lib/types.js';
import { parseURL } from '$lib/utils.js';
import { describe, expect, it } from 'vitest';

describe('parseURL with default values', () => {
	const schema = {
		id: 'number',
		name: 'string',
		active: 'boolean',
		created: 'date',
		tags: ['string'],
		color: '<red,green,blue>'
	} satisfies Schema;

	const defaultValue = {
		id: 1,
		name: 'Default User',
		active: true,
		created: new Date('2023-01-01T00:00:00Z'),
		tags: ['default'],
		color: 'blue'
	} satisfies Default<typeof schema>;

	it('should use default values when URL parameters are missing', () => {
		const searchParams = new URLSearchParams({});
		const result = parseURL(searchParams, schema, defaultValue);

		expect(result).toEqual(defaultValue);
	});

	it('should override default values with provided URL parameters', () => {
		const searchParams = new URLSearchParams({
			id: '42',
			name: 'John Doe',
			active: 'false',
			'tags.0': 'custom'
		});
		const result = parseURL(searchParams, schema, defaultValue);

		expect(result).toEqual({
			id: 42,
			name: 'John Doe',
			active: false,
			created: new Date('2023-01-01T00:00:00Z'),
			tags: ['custom'],
			color: 'blue'
		});
	});

	it('should use default values for invalid URL parameters', () => {
		const searchParams = new URLSearchParams({
			id: 'invalid',
			active: 'not-a-boolean',
			color: 'yellow'
		});
		const result = parseURL(searchParams, schema, defaultValue);
		expect(result).toEqual({
			...defaultValue,
			id: null,
			active: null,
			color: null
		});
	});

	it('should handle partial default values', () => {
		const partialDefault = {
			id: 99,
			name: 'Partial Default'
		};
		const searchParams = new URLSearchParams({
			active: 'true',
			'tags.0': 'partial',
			color: 'green'
		});
		const result = parseURL(searchParams, schema, partialDefault);
		expect(result).toEqual({
			id: 99,
			name: 'Partial Default',
			active: true,
			created: null,
			tags: ['partial'],
			color: 'green'
		});
	});

	it('should handle array default values', () => {
		const arrayDefault = {
			...defaultValue,
			tags: ['tag1', 'tag2', 'tag3']
		};
		const searchParams = new URLSearchParams({
			'tags.1': 'custom'
		});
		const result = parseURL(searchParams, schema, arrayDefault);
		expect(result).toEqual({
			...arrayDefault,
			tags: ['tag1', 'custom', 'tag3']
		});
	});

	it('should handle date default values', () => {
		const dateDefault = {
			...defaultValue,
			created: new Date('2022-12-31T23:59:59Z')
		};
		const searchParams = new URLSearchParams({
			created: '2023-06-15T12:00:00Z'
		});
		const result = parseURL(searchParams, schema, dateDefault);
		expect(result).toEqual({
			...dateDefault,
			created: new Date('2023-06-15T12:00:00Z')
		});
	});

	it('should handle enum default values', () => {
		const enumDefault = {
			...defaultValue,
			color: 'green' as 'red' | 'green' | 'blue'
		};
		const searchParams = new URLSearchParams({});
		const result = parseURL(searchParams, schema, enumDefault);
		expect(result).toEqual(enumDefault);
	});

	it('should use schema-defined types even when default value types differ', () => {
		const mixedTypeDefault = {
			id: '100' as unknown as number, // Intentionally wrong type
			active: 1 as unknown as boolean, // Intentionally wrong type
			created: '2023-01-01' as unknown as Date // Intentionally wrong type
		};
		const searchParams = new URLSearchParams({});
		const result = parseURL(searchParams, schema, mixedTypeDefault);

		expect(result).toEqual({
			id: 100,
			name: null,
			active: true,
			created: new Date('2023-01-01'),
			tags: [],
			color: null
		});
	});

	it('should handle default values for nested schemas', () => {
		const nestedSchema: Schema = {
			user: {
				id: 'number',
				name: 'string',
				preferences: {
					theme: '<light,dark>',
					notifications: 'boolean'
				}
			}
		};
		const nestedDefault = {
			user: {
				id: 1,
				name: 'Default User',
				preferences: {
					theme: 'light',
					notifications: true
				}
			}
		};
		const searchParams = new URLSearchParams({
			'user.name': 'John Doe',
			'user.preferences.theme': 'dark'
		});
		const result = parseURL(searchParams, nestedSchema, nestedDefault);

		expect(result).toEqual({
			user: {
				id: 1,
				name: 'John Doe',
				preferences: {
					theme: 'dark',
					notifications: true
				}
			}
		});
	});
});

describe('Complex default value handling', () => {
	const complexSchema: Schema = {
		user: {
			id: 'number',
			name: 'string',
			roles: ['string'],
			settings: {
				theme: '<light,dark>',
				notifications: {
					email: 'boolean',
					push: 'boolean'
				}
			},
			posts: [
				{
					id: 'number',
					title: 'string',
					tags: ['string']
				}
			]
		},
		app: {
			version: 'string',
			features: ['string']
		}
	};

	const complexDefault: Default<typeof complexSchema> = {
		user: {
			id: 1,
			name: 'Default User',
			roles: ['user'],
			settings: {
				theme: 'light',
				notifications: {
					email: true,
					push: false
				}
			},
			posts: [
				{
					id: 101,
					title: 'Default Post',
					tags: ['default']
				}
			]
		},
		app: {
			version: '1.0.0',
			features: ['basic']
		}
	};

	it('should handle deeply nested objects and arrays', () => {
		const searchParams = new URLSearchParams({
			'user.name': 'John Doe',
			'user.roles.0': 'admin',
			'user.roles.1': 'editor',
			'user.settings.theme': 'dark',
			'user.settings.notifications.push': 'true',
			'user.posts.0.title': 'New Post',
			'user.posts.0.tags.0': 'important',
			'user.posts.0.tags.1': 'featured',
			'app.features.0': 'advanced'
		});

		const result = parseURL(searchParams, complexSchema, complexDefault);

		expect(result).toEqual({
			user: {
				id: 1,
				name: 'John Doe',
				roles: ['admin', 'editor'],
				settings: {
					theme: 'dark',
					notifications: {
						email: true,
						push: true
					}
				},
				posts: [
					{
						id: 101,
						title: 'New Post',
						tags: ['important', 'featured']
					}
				]
			},
			app: {
				version: '1.0.0',
				features: ['advanced']
			}
		});
	});

	it('should handle partial updates to nested arrays of objects', () => {
		const searchParams = new URLSearchParams({
			'user.posts.0.id': '102',
			'user.posts.1.title': 'Second Post',
			'user.posts.1.tags.0': 'new'
		});

		const result = parseURL(searchParams, complexSchema, complexDefault);

		console.dir({ result }, { depth: null });
		expect(result).toEqual({
			...complexDefault,
			user: {
				...complexDefault.user,
				posts: [
					{
						id: 102,
						title: 'Default Post',
						tags: ['default']
					},
					{
						id: null,
						title: 'Second Post',
						tags: ['new']
					}
				]
			}
		});
	});

	it('should handle missing nested objects', () => {
		const partialDefault = {
			user: {
				id: 1,
				name: 'Partial User'
			},
			app: {
				version: '0.9.0'
			}
		};

		const searchParams = new URLSearchParams({
			'user.roles.0': 'guest',
			'user.settings.theme': 'dark',
			'app.features.0': 'beta'
		});

		const result = parseURL(searchParams, complexSchema, partialDefault);

		expect(result).toEqual({
			user: {
				id: 1,
				name: 'Partial User',
				roles: ['guest'],
				settings: {
					theme: 'dark',
					notifications: {
						email: null,
						push: null
					}
				},
				posts: []
			},
			app: {
				version: '0.9.0',
				features: ['beta']
			}
		});
	});
});
