import { getPostBaseSlugs } from "$lib/posts";

export function entries() {
	return getPostBaseSlugs().map((slug) => ({ slug }));
}
