/**
 * Типы контента. Общие для редактора, скриптов и линтера.
 *
 * `weekly` намеренно отсутствует: он генерируется автоматически и не
 * редактируется вручную.
 */

export const CONTENT_TYPES = ["post", "article", "project"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_LANGS = ["ru", "en"] as const;

export type ContentLang = (typeof CONTENT_LANGS)[number];

export const DEFAULT_LANG: ContentLang = "ru";
