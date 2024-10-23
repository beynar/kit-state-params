// import { parseURL } from '$lib/index.js';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const load = async () => {
	await wait(2000);
	console.log('yes');
	// const searchParams = parseURL(url, {
	// 	search: 'string',
	// 	tags: ['number'],
	// 	enum: 'enum<test,test2>'
	// });
	// console.log('server', searchParams.enum);
	// return {
	// 	searchParams
	// };
	return {
		hello: Date.now()
	};
};
