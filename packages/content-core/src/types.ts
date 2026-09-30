// `weekly` генерируется автоматически и не редактируется руками, поэтому в
// CONTENT_TYPES его нет. В frontmatter.json тип остаётся.
export const CONTENT_TYPES = ["post", "article", "project"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_LANGS = ["ru", "en"] as const;

export type ContentLang = (typeof CONTENT_LANGS)[number];

export const DEFAULT_LANG: ContentLang = "ru";

export type Frontmatter = Record<string, unknown>;

export interface ContentUnit {
	type: ContentType;
	slug: string;
	lang: ContentLang;
	frontmatter: Frontmatter;
	body: string;
}

export interface UnitSummary {
	type: ContentType;
	slug: string;
	langs: ContentLang[];
	title: string;
	date: string;
	draft: boolean;
	needsTranslation: boolean;
	updatedAt: string;
}
