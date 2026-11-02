// NOTE: kept apart from `tags.ts` so the browser form can use these pure string
// helpers without pulling in `node:fs`.

export function normalizeTag(raw: string): string {
	return raw.trim().replace(/^#+/, "").toLowerCase();
}

// NOTE: spaces and commas are banned because tags are stored as a list but typed
// as one string, and such a tag would silently split on the next save.
export function tagError(tag: string): string | null {
	if (!tag) return "пустой тег";
	if (tag.includes(",")) return "тег не может содержать запятую";
	if (/\s/.test(tag)) return "тег не может содержать пробелы";
	return null;
}

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
