import { getArticleBaseSlugs, getArticleDetail } from "$lib/articles";
import { LANGS, type ContentLang } from "$lib/content";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return LANGS.flatMap((lang) =>
		getArticleBaseSlugs().map((slug) => ({ lang, slug })),
	);
}

export function load({
	params,
}: {
	params: { lang: ContentLang; slug: string };
}) {
	const article = getArticleDetail(params.slug, params.lang);

	if (!article) {
		error(NOT_FOUND, "Article not found");
	}

	return {
		meta: article.meta,
		content: article.meta.module.default,
		alt: {
			meta: article.altMeta,
			content: article.altMeta.module.default,
		},
	};
}
