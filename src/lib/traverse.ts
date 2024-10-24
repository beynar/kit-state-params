import type { Primitive, Schema } from './types.js';
import { isPrimitive } from './utils.js';

export const traverseSchema = ({
	schema,
	path = '',
	follower = null,
	cb
}: {
	schema: Schema;
	path?: string;
	follower?: any;
	cb: (p: { path: string; primitive: Primitive; follower?: any | null }) => void;
}) => {
	for (const [key, schemaType] of Object.entries(schema)) {
		const isArray = Array.isArray(schemaType);
		const type = isArray ? schemaType[0] : schemaType;
		const primitive = isPrimitive(type) ? type : undefined;
		const schema = isPrimitive(type) ? undefined : type;
		const newPath = path ? `${path}.${key}` : key;
		if (primitive) {
			if (isArray) {
				for (let i = 0; ; i++) {
					const arrayPath = `${newPath}.${i}`;
					const value = follower[key]?.[i];
					if (!value) break;
					cb({ path: arrayPath, primitive, follower: value });
				}
			} else {
				cb({ path: newPath, primitive, follower: follower[key] });
			}
		} else if (schema) {
			if (isArray) {
				for (let i = 0; ; i++) {
					const arrayPath = `${newPath}.${i}`;
					const value = follower[key]?.[i];
					if (!value) break;
					traverseSchema({
						schema,
						path: arrayPath,
						follower: value,
						cb
					});
				}
			} else {
				traverseSchema({
					schema,
					path: newPath,
					follower: follower[key],
					cb
				});
			}
		}
	}
};
