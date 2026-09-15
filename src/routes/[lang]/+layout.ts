import { error } from "@sveltejs/kit";
import { LANGS } from "$lib/content";

const NOT_FOUND = 404;

export function load({ params }: { params: { lang: string } }) {
	const lang = LANGS.find((item) => item === params.lang);

	if (!lang) {
		error(NOT_FOUND, "Lang not found");
	}

	return { lang };
}
