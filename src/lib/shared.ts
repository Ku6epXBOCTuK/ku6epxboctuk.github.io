import type { SharedRecord } from "$lib/content";

// NOTE: a type with no content has no `<type>s.json`, and an empty glob is
// normal there, not a build error.

// NOTE: a single-file glob yields one record; the path key is discarded.
export function sharedFrom(
	glob: Record<string, SharedRecord> | undefined,
): SharedRecord | undefined {
	return Object.values(glob ?? {})[0];
}

// NOTE: sources merge in order; a later one wins per field.
export function mergeShared(
	...sources: (SharedRecord | undefined)[]
): SharedRecord {
	const out: SharedRecord = {};
	for (const source of sources) {
		for (const [slug, fields] of Object.entries(source ?? {})) {
			out[slug] = { ...out[slug], ...fields };
		}
	}
	return out;
}
