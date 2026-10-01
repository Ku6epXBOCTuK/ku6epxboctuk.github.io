import type { FieldNames, FieldScope } from "./fields.ts";
import type { ContentLang, SchemaType } from "./types.ts";

/*
 * Форма единицы контента — то, что видит потребитель: редактор, сайт, weekly.
 * Где именно лежит каждое поле, отсюда не видно и знать не нужно: репозиторий
 * разложил при чтении и сложит обратно при записи.
 *
 * Имена полей выведены из схемы, а не написаны руками. Ручной интерфейс
 * продублировал бы `fields.ts` и разошёлся с ним на первой же правке.
 */

export type SharedOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "shared">, unknown>
>;

export type LocalOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "local">, unknown>
>;

export type TranslatableOf<T extends SchemaType> = Partial<
	Record<FieldNames<T, "translatable">, unknown>
>;

/** Языковая версия: frontmatter с переводимыми полями и тело markdown. */
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

/**
 * Что приходит на сохранение. Отличается от `Entry` только типом: принимается
 * ровно то, что вернул `loadEntry`, поэтому редактор не может придумать поля.
 */
export type EntryInput<T extends SchemaType = SchemaType> = Entry<T>;

/** Плоская запись `<type>s.json`: ключ — slug. */
export type MetaRecord<T extends SchemaType = SchemaType> = Record<
	string,
	SharedOf<T>
>;

/** Плоская запись `<type>s.local.json`: ключ — slug. */
export type LocalRecord<T extends SchemaType = SchemaType> = Record<
	string,
	LocalOf<T>
>;

export interface EntrySummary<T extends SchemaType = SchemaType> {
	type: T;
	slug: string;
	langs: ContentLang[];
	/** Заголовок RU для списка; EN может быть пустым. */
	title: string;
	draft: boolean;
	needsTranslation: boolean;
	updatedAt: string;
}

export interface SaveResult<T extends SchemaType = SchemaType> {
	entry: Entry<T>;
	/** Какие файлы тронуты — редактору не нужно, но тестам и логам полезно. */
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

/**
 * Все поля единицы в одной плоской карте, независимо от места хранения.
 * Нужна валидации и статистике: они не должны знать про три файла.
 */
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
