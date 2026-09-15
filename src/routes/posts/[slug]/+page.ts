import { getPost, getPostBaseSlugs } from "$lib/posts";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return getPostBaseSlugs().map((slug) => ({ slug }));
}

export function load({ params }: { params: { slug: string } }) {
	const post = getPost(params.slug);

	if (!post) {
		error(NOT_FOUND, "Post not found");
	}

	return {
		meta: post.meta,
		content: post.PostComponent,
	};
}
