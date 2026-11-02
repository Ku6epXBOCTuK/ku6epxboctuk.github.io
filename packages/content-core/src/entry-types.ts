import { fieldScope } from "./fields.ts";
import type { FieldNames, FieldScope } from "./fields.ts";
import { CONTENT_LANGS, type ContentLang, type SchemaType } from "./types.ts";

export type SharedOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "shared">, unknown>
>;

export type LocalOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "local">, unknown>
>;

export type TranslatableOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "translatable">, unknown>
>;

export interface Version<T extends SchemaType = SchemaType> {
	frontmatter: TranslatableOf<T>;
	body: string;
}

export type Versions<T extends SchemaType = SchemaType> = Record<
	ContentLang,
	Version<T>
>;

export interface Entry<T extends SchemaType = SchemaType> {
	type: T;
	slug: string;
	shared: SharedOf<T>;
	local: LocalOf<T>;
	versions: Versions<T>;
}

export type EntryInput<T extends SchemaType = SchemaType> = Entry<T>;

export type MetaRecord<T extends SchemaType = SchemaType> = Record<
	string,
	SharedOf<T>
>;

export type LocalRecord<T extends SchemaType = SchemaType> = Record<
	string,
	LocalOf<T>
>;

export interface EntrySummary<T extends SchemaType = SchemaType> {
	type: T;
	slug: string;
	langs: ContentLang[];
	/** List title comes from RU; EN may be empty. */
	title: string;
	draft: boolean;
	needsTranslation: boolean;
	updatedAt: string;
}

export interface SaveResult<T extends SchemaType = SchemaType> {
	entry: Entry<T>;

	written: string[];
}

export function emptyVersion<T extends SchemaType>(): Version<T> {
	return { frontmatter: {}, body: "" };
}

export function emptyEntry<T extends SchemaType>(
	type: T,
	slug: string,
): Entry<T> {
	return {
		type,
		slug,
		shared: {},
		local: {},
		versions: {
			ru: emptyVersion<T>(),
			en: emptyVersion<T>(),
		},
	};
}

type Bag = Record<string, unknown>;

function asBag(raw: unknown): Bag {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	return raw as Bag;
}

// NOTE: flat maps arrive from `defaultsFor` and GitHub; a field outside the
// schema lands nowhere and validation reports it instead of rejecting the save.
export function entryFromFlat<T extends SchemaType>(
	type: T,
	slug: string,
	flat: Bag,
): Entry<T> {
	const entry = emptyEntry(type, slug);

	for (const [name, value] of Object.entries(flat)) {
		switch (fieldScope(type, name)) {
			case "shared":
				(entry.shared as Bag)[name] = value;
				break;
			case "local":
				(entry.local as Bag)[name] = value;
				break;
			case "translatable":
				for (const lang of CONTENT_LANGS) {
					(entry.versions[lang].frontmatter as Bag)[name] = value;
				}
				break;
		}
	}

	return entry;
}

// NOTE: the only place untrusted input becomes an Entry; missing or non-object
// values become empty, and `splitEntry` drops empty ones when writing.
export function entryFromInput<T extends SchemaType>(
	type: T,
	slug: string,
	raw: unknown,
): Entry<T> {
	const source = asBag(raw);
	const versions = asBag(source.versions);

	const entry = emptyEntry(type, slug);
	entry.shared = asBag(source.shared) as Entry<T>["shared"];
	entry.local = asBag(source.local) as Entry<T>["local"];

	for (const lang of CONTENT_LANGS) {
		const version = asBag(versions[lang]);
		entry.versions[lang] = {
			frontmatter: asBag(
				version.frontmatter,
			) as Entry<T>["versions"][typeof lang]["frontmatter"],
			body: typeof version.body === "string" ? version.body : "",
		};
	}

	return entry;
}

export function flattenEntry(entry: Entry): Record<string, unknown> {
	const out: Record<string, unknown> = { ...entry.shared, ...entry.local };

	for (const version of Object.values(entry.versions)) {
		Object.assign(out, version.frontmatter);
	}

	return out;
}

export const SCOPES: readonly FieldScope[] = [
	"translatable",
	"shared",
	"local",
] as const;
