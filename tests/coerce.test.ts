import { describe, it, expect } from 'vitest';
import { coerceObject, coerceArray, coercePrimitiveArray, coercePrimitive } from '$lib/coerce.js';
import type { Schema } from '$lib/types.js';

describe('coerce functions', () => {
	describe('coercePrimitive', () => {
		it('should coerce string values', () => {
			expect(coercePrimitive('string', 'hello')).toBe('hello');
			expect(coercePrimitive('string', '')).toBe(null);
			expect(coercePrimitive('string', null)).toBe(null);
		});

		it('should coerce number values', () => {
			expect(coercePrimitive('number', '42')).toBe(42);
			expect(coercePrimitive('number', '-3.14')).toBe(-3.14);
			expect(coercePrimitive('number', 'not a number')).toBe(null);
			expect(coercePrimitive('number', '')).toBe(null);
		});

		it('should coerce boolean values', () => {
			expect(coercePrimitive('boolean', 'true')).toBe(true);
			expect(coercePrimitive('boolean', 'false')).toBe(false);
			expect(coercePrimitive('boolean', '1')).toBe(true);
			expect(coercePrimitive('boolean', '0')).toBe(false);
			expect(coercePrimitive('boolean', 'invalid')).toBe(null);
		});

		it('should coerce date values', () => {
			expect(coercePrimitive('date', '2023-05-01')).toEqual(new Date('2023-05-01'));
			expect(coercePrimitive('date', 'invalid date')).toBe(null);
		});

		it('should handle enum values', () => {
			expect(coercePrimitive('<red,green,blue>', 'red')).toBe('red');
			expect(coercePrimitive('<red,green,blue>', 'yellow')).toBe(null);
		});
	});

	describe('coerceObject', () => {
		it('should coerce a simple object correctly', () => {
			const schema = {
				name: 'string',
				age: 'number',
				isStudent: 'boolean'
			} satisfies Schema;

			const value = {
				name: 'John Doe',
				age: '25',
				isStudent: 'true'
			};

			const expected = {
				name: 'John Doe',
				age: 25,
				isStudent: true
			};

			expect(coerceObject(schema, value)).toEqual(expected);
		});

		it('should handle nested objects', () => {
			const schema = {
				user: {
					name: 'string',
					details: {
						age: 'number',
						birthDate: 'date'
					}
				}
			} satisfies Schema;
			const value = {
				user: {
					name: 'Jane Doe',
					details: {
						age: '30',
						birthDate: '1993-05-15'
					}
				}
			};
			const expected = {
				user: {
					name: 'Jane Doe',
					details: {
						age: 30,
						birthDate: new Date('1993-05-15')
					}
				}
			};
			expect(coerceObject(schema, value)).toEqual(expected);
		});

		it('should handle objects with array properties', () => {
			const schema = {
				name: 'string',
				scores: ['number']
			} satisfies Schema;
			const value = {
				name: 'John',
				scores: ['85', '90', '95']
			};
			const expected = {
				name: 'John',
				scores: [85, 90, 95]
			};
			expect(coerceObject(schema, value)).toEqual(expected);
		});

		it('should handle objects with nested array properties', () => {
			const schema = {
				user: {
					name: 'string',
					friends: [{ name: 'string', age: 'number' }]
				}
			} satisfies Schema;
			const value = {
				user: {
					name: 'Alice',
					friends: [
						{ name: 'Bob', age: '25' },
						{ name: 'Charlie', age: '30' }
					]
				}
			};
			const expected = {
				user: {
					name: 'Alice',
					friends: [
						{ name: 'Bob', age: 25 },
						{ name: 'Charlie', age: 30 }
					]
				}
			};
			expect(coerceObject(schema, value)).toStrictEqual(expected);
		});

		it('should handle missing properties', () => {
			const schema = {
				name: 'string',
				age: 'number'
			} satisfies Schema;
			const value = {
				name: 'John'
			};
			const expected = {
				name: 'John',
				age: null
			};
			expect(coerceObject(schema, value)).toEqual(expected);
		});
	});

	describe('coerceArray', () => {
		it('should coerce an array of objects', () => {
			const schema = {
				name: 'string',
				age: 'number'
			} satisfies Schema;
			const value = [
				{ name: 'Alice', age: '28' },
				{ name: 'Bob', age: '32' }
			];
			const expected = [
				{ name: 'Alice', age: 28 },
				{ name: 'Bob', age: 32 }
			];
			expect(coerceArray(schema, value)).toEqual(expected);
		});

		it('should handle empty arrays', () => {
			const schema = {
				name: 'string',
				age: 'number'
			} satisfies Schema;
			const value: any[] = [];
			expect(coerceArray(schema, value)).toEqual([]);
		});

		it('should handle arrays of nested objects', () => {
			const schema = {
				name: 'string',
				details: {
					age: 'number',
					isStudent: 'boolean'
				}
			} satisfies Schema;
			const value = [
				{ name: 'Alice', details: { age: '25', isStudent: 'true' } },
				{ name: 'Bob', details: { age: '30', isStudent: 'false' } }
			];
			const expected = [
				{ name: 'Alice', details: { age: 25, isStudent: true } },
				{ name: 'Bob', details: { age: 30, isStudent: false } }
			];
			expect(coerceArray(schema, value)).toEqual(expected);
		});

		it('should handle null values', () => {
			const schema = {
				name: 'string',
				age: 'number'
			} satisfies Schema;
			expect(coerceArray(schema, null)).toBe(null);
		});
	});

	describe('coercePrimitiveArray', () => {
		it('should coerce an array of numbers', () => {
			const value = ['1', '2', '3', '4', '5'];
			const expected = [1, 2, 3, 4, 5];
			expect(coercePrimitiveArray('number', value)).toEqual(expected);
		});

		it('should coerce an array of booleans', () => {
			const value = ['true', 'false', 'true', 'true', 'false'];
			const expected = [true, false, true, true, false];
			expect(coercePrimitiveArray('boolean', value)).toEqual(expected);
		});

		it('should coerce an array of dates', () => {
			const value = ['2023-01-01', '2023-02-15', '2023-03-30'];
			const expected = [new Date('2023-01-01'), new Date('2023-02-15'), new Date('2023-03-30')];
			expect(coercePrimitiveArray('date', value)).toEqual(expected);
		});

		it('should handle invalid values in the array', () => {
			const value = ['1', '2', 'not a number', '4', '5'];
			const expected = [1, 2, 4, 5];
			expect(coercePrimitiveArray('number', value)).toEqual(expected);
		});

		it('should handle mixed valid and invalid values', () => {
			const value = ['true', 'not boolean', 'false', '1', '0'];
			const expected = [true, false, true, false];
			expect(coercePrimitiveArray('boolean', value)).toEqual(expected);
		});

		it('should handle null input', () => {
			expect(coercePrimitiveArray('number', null)).toBe(null);
		});

		it('should handle enum arrays', () => {
			const value = ['red', 'green', 'invalid', 'blue', 'yellow'];
			const expected = ['red', 'green', 'blue'];
			expect(coercePrimitiveArray('<red,green,blue>', value)).toEqual(expected);
		});
	});
});

describe('coerce functions with default values', () => {
	describe('coercePrimitive with default values', () => {
		it('should use default value for null input', () => {
			expect(coercePrimitive('string', null, 'default')).toBe('default');
			expect(coercePrimitive('number', null, 0)).toBe(0);
			expect(coercePrimitive('boolean', null, false)).toBe(false);
			expect(coercePrimitive('date', null, new Date('2000-01-01'))).toEqual(new Date('2000-01-01'));
		});

		it('should use default value for invalid input', () => {
			expect(coercePrimitive('number', 'not a number', 42)).toBe(42);
			expect(coercePrimitive('boolean', 'invalid', true)).toBe(true);
			expect(coercePrimitive('date', 'invalid date', new Date('2000-01-01'))).toEqual(
				new Date('2000-01-01')
			);
		});

		it('should use default value for empty string', () => {
			expect(coercePrimitive('string', '', 'default')).toBe('default');
		});
	});

	describe('coerceObject with default values', () => {
		it('should use default values for missing properties', () => {
			const schema = {
				name: 'string',
				age: 'number',
				isStudent: 'boolean'
			} satisfies Schema;

			const value = {
				name: 'John'
			};

			const defaultValue = {
				name: 'Unknown',
				age: 0,
				isStudent: false
			};

			const expected = {
				name: 'John',
				age: 0,
				isStudent: false
			};

			expect(coerceObject(schema, value, defaultValue)).toStrictEqual(expected);
		});

		it('should use default values for nested objects', () => {
			const schema = {
				user: {
					name: 'string',
					details: {
						age: 'number',
						isStudent: 'boolean'
					}
				}
			} satisfies Schema;

			const value = {
				user: {
					name: 'Alice',
					details: {
						age: '25'
					}
				}
			};

			const defaultValue = {
				user: {
					name: 'Unknown',
					details: {
						age: 0,
						isStudent: false
					}
				}
			};

			const expected = {
				user: {
					name: 'Alice',
					details: {
						age: 25,
						isStudent: false
					}
				}
			};

			expect(coerceObject(schema, value, defaultValue)).toEqual(expected);
		});
	});

	describe('coerceArray with default values', () => {
		it('should use default value for null input', () => {
			const schema = {
				name: 'string',
				age: 'number'
			} satisfies Schema;

			const defaultValue = [{ name: 'Default', age: 0 }];

			expect(coerceArray(schema, null, defaultValue)).toEqual(defaultValue);
		});

		it('should use default values for missing properties in array items', () => {
			const schema = {
				name: 'string',
				age: 'number',
				isStudent: 'boolean'
			} satisfies Schema;

			const value = [
				{ name: 'Alice', age: '25' },
				{ name: 'Bob', isStudent: 'true' }
			];

			const defaultValue = [{ name: 'Unknown', age: 0, isStudent: false }];

			const expected = [
				{ name: 'Alice', age: 25, isStudent: false },
				{ name: 'Bob', age: null, isStudent: true }
			];
			console.log(coerceArray(schema, value, defaultValue));
			expect(coerceArray(schema, value, defaultValue)).toEqual(expected);
		});
	});

	describe('coercePrimitiveArray with default values', () => {
		it('should use default value for null input', () => {
			const defaultValue = [1, 2, 3];
			expect(coercePrimitiveArray('number', null, defaultValue)).toEqual(defaultValue);
		});

		it('should use default values for invalid items in the array', () => {
			const value = ['1', 'invalid', '3', 'not a number', '5'];
			const defaultValue = [0, 0, 0, 0, 0];
			const expected = [1, 0, 3, 0, 5];
			expect(coercePrimitiveArray('number', value, defaultValue)).toEqual(expected);
		});
	});
});
