/*
 * Правила для тегов, которые не ходят в файловую систему.
 *
 * Вынесены отдельно от `tags.ts`, который переписывает записи на диске: форма
 * редактора работает в браузере и не должна тянуть за собой `node:fs`. Всё, что
 * тут есть, — чистые функции над строкой и списком.
 */

/**
 * Тег приводится к виду, в котором он хранится: без решётки, без краёв и в
 * нижнем регистре. Так один и тот же тег не может появиться двумя записями
 * (`CSS`, `css`, `#css`).
 */
export function normalizeTag(raw: string): string {
	return raw.trim().replace(/^#+/, "").toLowerCase();
}

/**
 * Почему тег не годится, либо `null`, если годится.
 *
 * Пробелы и запятая запрещены не по вкусу: теги хранятся списком, а форма
 * принимает их строкой, и такой тег распался бы молча при следующем сохранении.
 */
export function tagError(tag: string): string | null {
	if (!tag) return "пустой тег";
	if (tag.includes(",")) return "тег не может содержать запятую";
	if (/\s/.test(tag)) return "тег не может содержать пробелы";
	return null;
}

/** Теги одной единицы прибраны: без мусора, повторов и регистра. */
export function tidyTags(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];

	const out: string[] = [];
	for (const item of raw) {
		if (typeof item !== "string") continue;
		const tag = normalizeTag(item);
		if (!tag || tagError(tag) || out.includes(tag)) continue;
		out.push(tag);
	}

	return out;
}
