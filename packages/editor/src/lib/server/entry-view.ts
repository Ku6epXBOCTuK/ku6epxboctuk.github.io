import {
	CONTENT_LANGS,
	emptyEntry,
	fieldsWithScope,
	type ContentLang,
	type Entry,
	type SchemaType,
} from "@ku6epxboctuk/content-core";

/*
 * Проекция Entry в вид, который уже понимает редактор: у каждого языка один
 * frontmatter со всеми полями.
 *
 * Общие и локальные поля подставляются в оба языка. Для редактора это выглядит
 * как прежде — он и раньше правил их в одной колонке — но правда живёт в Entry,
 * а разложение по файлам делает репозиторий. Фаза с фронтендом на Entry эту
 * проекцию удалит.
 */

export interface LegacyVersion {
	frontmatter: Record<string, unknown>;
	body: string;
}

export interface EntryView {
	slug: string;
	ru: LegacyVersion;
	en: LegacyVersion;
}

export function toEntryView(entry: Entry): EntryView {
	const shared = { ...entry.shared, ...entry.local };

	const version = (lang: ContentLang): LegacyVersion => ({
		frontmatter: { ...shared, ...entry.versions[lang].frontmatter },
		body: entry.versions[lang].body,
	});

	return {
		slug: entry.slug,
		ru: version("ru"),
		en: version("en"),
	};
}

export function fromEntryView(
	type: SchemaType,
	slug: string,
	view: EntryView,
): Entry {
	const entry = emptyEntry(type, slug);
	const shared = fieldsWithScope(type, "shared").map((field) => field.name);
	const local = fieldsWithScope(type, "local").map((field) => field.name);

	// Общее берём из RU: он есть всегда, и первым делом он правда для обоих.
	const source = { ...view.ru.frontmatter, ...view.en.frontmatter };

	for (const name of shared) {
		const value = source[name];
		if (value !== undefined)
			(entry.shared as Record<string, unknown>)[name] = value;
	}
	for (const name of local) {
		const value = source[name];
		if (value !== undefined)
			(entry.local as Record<string, unknown>)[name] = value;
	}

	for (const lang of CONTENT_LANGS) {
		const version = lang === "ru" ? view.ru : view.en;
		const own: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(version.frontmatter)) {
			own[key] = value;
		}
		entry.versions[lang] = { frontmatter: own, body: version.body };
	}

	return entry;
}

/** Выкидывает пустые значения: форма присылает их на каждый чих. */
export function cleanRecord(
	source: Record<string, unknown>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(source)) {
		if (value === null || value === "") continue;
		if (Array.isArray(value)) {
			const items = value.filter((item) => item !== "");
			if (items.length > 0) out[key] = items;
			continue;
		}
		out[key] = value;
	}
	return out;
}
