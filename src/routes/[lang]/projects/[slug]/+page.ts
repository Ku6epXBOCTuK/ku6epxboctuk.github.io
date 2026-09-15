import { getProject, getProjectBaseSlugs } from "$lib/projects";
import { LANGS, type ContentLang } from "$lib/content";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return LANGS.flatMap((lang) =>
		getProjectBaseSlugs().map((slug) => ({ lang, slug })),
	);
}

export function load({
	params,
}: {
	params: { lang: ContentLang; slug: string };
}) {
	const project = getProject(params.slug, params.lang);

	if (!project) {
		error(NOT_FOUND, "Project not found");
	}

	return {
		meta: project.meta,
		alt: project.altMeta,
	};
}
