export const load = async ({ url }: { url: URL }) => {
	const searchParams = Object.fromEntries(url.searchParams.entries());

	return {
		searchParams
	};
};
