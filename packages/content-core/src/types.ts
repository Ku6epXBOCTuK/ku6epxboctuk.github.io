// NOTE: `weekly` is generated and never edited by hand, so it has no entry in
// CONTENT_TYPES, but its files and schema exist and live in SCHEMA_TYPES.
export const SCHEMA_TYPES = ["post", "article", "project", "weekly"] as const;

export type SchemaType = (typeof SCHEMA_TYPES)[number];

export const CONTENT_TYPES = ["post", "article", "project"] as const;

export type ContentType = Exclude<SchemaType, "weekly">;

export const CONTENT_LANGS = ["ru", "en"] as const;

export type ContentLang = (typeof CONTENT_LANGS)[number];

export const DEFAULT_LANG: ContentLang = "ru";

export function isContentType(value: string): value is ContentType {
	return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isSchemaType(value: string): value is SchemaType {
	return (SCHEMA_TYPES as readonly string[]).includes(value);
}

export function isContentLang(value: string): value is ContentLang {
	return (CONTENT_LANGS as readonly string[]).includes(value);
}

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

/**
 * Parsing of a project's frontmatter `path`; the type lives here because the
 * browser error page needs it while the parser itself touches fs.
 */
export type ProjectPathState = "ok" | "not-set" | "missing" | "not-a-repo";

export interface ProjectPathReport {
	slug: string;
	title: string;

	declared: string | null;

	resolved: string | null;
	state: ProjectPathState;
}
