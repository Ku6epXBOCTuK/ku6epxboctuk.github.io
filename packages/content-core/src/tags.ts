import { listEntries, loadEntry, saveEntry } from "./entries.ts";
import { repoRoot } from "./paths.ts";
import { normalizeTag, tagError } from "./tag-rules.ts";
import type { Entry } from "./entry-types.ts";
import type { ContentType } from "./types.ts";

// NOTE: a tag is not an entity: it lives in `shared.tags` of each unit, so a
// rename rewrites every unit and the list can never drift from the content.
export interface TaggedUnit {
	type: ContentType;
	slug: string;
}

export interface TagUsage {
	tag: string;
	units: TaggedUnit[];
}

export interface TagChange {
	changed: number;
	units: TaggedUnit[];
}

function tagsOf(entry: Entry): string[] {
	const tags = entry.shared.tags;
	if (!Array.isArray(tags)) return [];
	return tags.filter((tag): tag is string => typeof tag === "string");
}

const TAGGED: ContentType[] = ["post", "article", "project"];

// NOTE: frequency first, then alphabetically, so the list does not reshuffle between opens.
export function collectTags(root: string = repoRoot()): TagUsage[] {
	const buckets = new Map<string, TaggedUnit[]>();

	for (const type of TAGGED) {
		for (const summary of listEntries(type, root)) {
			const entry = loadEntry(type, summary.slug, root);
			if (!entry) continue;

			for (const raw of new Set(tagsOf(entry))) {
				const tag = normalizeTag(raw);
				if (!tag) continue;

				const bucket = buckets.get(tag) ?? [];
				bucket.push({ type, slug: summary.slug });
				buckets.set(tag, bucket);
			}
		}
	}

	return [...buckets.entries()]
		.map(([tag, units]) => ({ tag, units }))
		.sort(
			(a, b) => b.units.length - a.units.length || a.tag.localeCompare(b.tag),
		);
}

async function rewriteTags(
	from: string,
	to: string | null,
	root: string,
): Promise<TagChange> {
	const units: TaggedUnit[] = [];

	for (const type of TAGGED) {
		for (const summary of listEntries(type, root)) {
			const entry = loadEntry(type, summary.slug, root);
			if (!entry) continue;

			const current = tagsOf(entry);
			if (!current.some((tag) => normalizeTag(tag) === from)) continue;

			// NOTE: duplicates collapse: renaming `css` to `style` leaves one tag
			// where both already existed.
			const next: string[] = [];
			for (const tag of current) {
				const value =
					normalizeTag(tag) === from ? (to as string) : normalizeTag(tag);
				if (!value || next.includes(value)) continue;
				next.push(value);
			}

			const input: Entry = {
				...entry,
				shared: { ...entry.shared, tags: next },
			};

			// NOTE: `saveEntry` rewrites `<type>s.json` whole, so writes must be
			// sequential or they clobber each other.
			await saveEntry(type, summary.slug, input, root);
			units.push({ type, slug: summary.slug });
		}
	}

	return { changed: units.length, units };
}

// NOTE: name validation lives here, not in the route: every caller gets it,
// and HTTP only maps the error to 400.
export async function renameTag(
	from: string,
	to: string,
	root: string = repoRoot(),
): Promise<TagChange> {
	const source = normalizeTag(from);
	const target = normalizeTag(to);

	const error = tagError(source) ?? (target ? tagError(target) : null);
	if (error) throw new Error(error);
	if (source === target) return { changed: 0, units: [] };

	return rewriteTags(source, target, root);
}

export async function removeTag(
	tag: string,
	root: string = repoRoot(),
): Promise<TagChange> {
	const value = normalizeTag(tag);
	const error = tagError(value);
	if (error) throw new Error(error);

	return rewriteTags(value, null, root);
}

// NOTE: a rename onto an existing tag merges them, which changes meaning; the
// preview reports that merge before anyone presses the button.

export interface TagPlan {
	from: string;
	to: string;

	exists: boolean;

	merge: boolean;

	affected: number;

	duplicates: number;

	resultCount: number;
	units: TaggedUnit[];
}

export function planTagRename(
	from: string,
	to: string,
	root: string = repoRoot(),
): TagPlan {
	const source = normalizeTag(from);
	const target = normalizeTag(to);
	const error = tagError(source) ?? (target ? tagError(target) : null);
	if (error) throw new Error(error);

	const index = collectTags(root);
	const sourceEntry = index.find((entry) => entry.tag === source);
	const targetEntry = index.find((entry) => entry.tag === target);
	const units = sourceEntry?.units ?? [];
	const targetSlugs = new Set(
		(targetEntry?.units ?? []).map((unit) => `${unit.type}/${unit.slug}`),
	);

	return {
		from: source,
		to: target,
		exists: Boolean(sourceEntry),
		merge: Boolean(targetEntry) && source !== target,
		affected: units.length,
		duplicates: units.filter((unit) =>
			targetSlugs.has(`${unit.type}/${unit.slug}`),
		).length,
		resultCount:
			(targetEntry?.units.length ?? 0) +
			(source !== target
				? units.filter((unit) => !targetSlugs.has(`${unit.type}/${unit.slug}`))
						.length
				: 0),
		units,
	};
}
