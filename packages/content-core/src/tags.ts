import { listEntries, loadEntry, saveEntry } from "./entries.ts";
import { repoRoot } from "./paths.ts";
import { normalizeTag, tagError } from "./tag-rules.ts";
import type { Entry } from "./entry-types.ts";
import type { ContentType } from "./types.ts";

/*
 * Операции над тегами, которые переписывают контент.
 *
 * Тег не отдельная сущность: он лежит в `shared.tags` у конкретной единицы.
 * Поэтому «переименовать тег» — это переписать его во всех единицах всех типов,
 * где он встречается. Своего хранилища у тегов нет, и это осознанно: список
 * тегов всегда ровно тот, что реально используется, и разойтись с контентом
 * он не может.
 *
 * Правила для самих тегов живут в `tag-rules.ts`, без `node:fs`, чтобы форма
 * в браузере могла их использовать.
 */

export interface TaggedUnit {
	type: ContentType;
	slug: string;
}

export interface TagUsage {
	tag: string;
	units: TaggedUnit[];
}

export interface TagChange {
	/** Сколько единиц переписано. */
	changed: number;
	units: TaggedUnit[];
}

function tagsOf(entry: Entry): string[] {
	const tags = entry.shared.tags;
	if (!Array.isArray(tags)) return [];
	return tags.filter((tag): tag is string => typeof tag === "string");
}

/** Типы, в которых теги вообще бывают. `weekly` генерируется и не правится. */
const TAGGED: ContentType[] = ["post", "article", "project"];

/**
 * Все теги по всем типам. Порядок — по убыванию частоты, при равном по
 * алфавиту, чтобы список не прыгал между открытиями страницы.
 */
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

			// Дубли схлопываются: после переименования «css» в «style» в единице,
			// где уже был «style», тег должен остаться один.
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

			/*
			 * Записи строго по одной: `saveEntry` перечитывает `<type>s.json` и
			 * пишет его целиком, поэтому параллельные вызовы затерели бы друг
			 * друга. Здесь это обычный цикл с ожиданием — медленно, но верно.
			 */
			await saveEntry(type, summary.slug, input, root);
			units.push({ type, slug: summary.slug });
		}
	}

	return { changed: units.length, units };
}

/**
 * Переименовать тег во всех единицах.
 *
 * Проверка имён живёт здесь, а не в роуте: правило должно работать для любого
 * вызывающего, а HTTP-слой — лишь приятно ответить «400» вместо исключения.
 */
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

/** Убрать тег из всех единиц. */
export async function removeTag(
	tag: string,
	root: string = repoRoot(),
): Promise<TagChange> {
	const value = normalizeTag(tag);
	const error = tagError(value);
	if (error) throw new Error(error);

	return rewriteTags(value, null, root);
}

/*
 * Предпросмотр переименования.
 *
 * Главное, о чём человек должен узнать до нажатия, — слияние. Если нового имени
 * уже нет, «переименовать» превращается в «склеить два тега», и это меняет
 * смысл: `css5` и `css` станут одним тегом, а не двумя похожими. Молча такое
 * делать нельзя.
 */

export interface TagPlan {
	from: string;
	to: string;
	/** Тег существует. */
	exists: boolean;
	/** Целевой тег уже есть — будет слияние. */
	merge: boolean;
	/** Сколько единиц переписывается. */
	affected: number;
	/** Сколько из них содержат оба тега: дубли, которые схлопнутся. */
	duplicates: number;
	/** Куда попадёт тег после слияния. */
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
