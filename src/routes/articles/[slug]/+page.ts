import { getArticleBaseSlugs } from "$lib/articles";

export function entries() {
	return getArticleBaseSlugs().map((slug) => ({ slug }));
}
