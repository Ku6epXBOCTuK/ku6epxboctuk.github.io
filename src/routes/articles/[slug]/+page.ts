import { getArticle, getArticleBaseSlugs } from "$lib/articles";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return getArticleBaseSlugs().map((slug) => ({ slug }));
}

export function load({ params }: { params: { slug: string } }) {
	const article = getArticle(params.slug);

	if (!article) {
		error(NOT_FOUND, "Article not found");
	}

	return {
		meta: article,
		content: article.module.default,
	};
}
