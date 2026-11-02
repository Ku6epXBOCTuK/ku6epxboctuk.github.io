let cache: Promise<string[]> | null = null;

async function fetchTags(): Promise<string[]> {
	try {
		const res = await fetch("/api/tags");
		if (!res.ok) return [];
		const data = (await res.json()) as { tags: { tag: string }[] };
		return data.tags.map((entry) => entry.tag);
	} catch {
		return [];
	}
}

export function knownTags(): Promise<string[]> {
	cache ??= fetchTags();
	return cache;
}
