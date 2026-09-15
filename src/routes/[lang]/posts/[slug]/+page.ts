import { getPost, getPostBaseSlugs } from "$lib/posts";
import { LANGS, type ContentLang } from "$lib/content";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return LANGS.flatMap((lang) =>
		getPostBaseSlugs().map((slug) => ({ lang, slug })),
	);
}

export function load({
	params,
}: {
	params: { lang: ContentLang; slug: string };
}) {
	const post = getPost(params.slug, params.lang);

	if (!post) {
		error(NOT_FOUND, "Post not found");
	}

	return {
		meta: post.meta,
		content: post.PostComponent,
	};
}
