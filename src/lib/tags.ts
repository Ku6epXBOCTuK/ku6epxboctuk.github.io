import type { ContentType } from "@ku6epxboctuk/content-core/shared";
import { getArticles, type Article } from "$lib/articles";
import { getPosts, type Post } from "$lib/posts";
import { getProjects, type Project } from "$lib/projects";
import { DEFAULT_LANG, type ContentLang } from "$lib/content";

/*
 * Теги живут в общем json и приезжают в карточки вместе с остальным, но
 * страницы тегов не было: теги можно было увидеть только внутри конкретной
 * карточки, и найти всё, что про svelte, было нельзя.
 *
 * Индекс собирается по всем типам сразу — одна страница, а не четыре, потому
 * что тег «css» может стоять и посту, и статье, и проекту.
 *
 * Запись таска хранит саму единицу, а не её слепок. Иначе карточке пришлось бы
 * работать с огрызком данных и кастовать его обратно.
 */

export interface Taggable {
	type: ContentType;
	/** Уникальный ключ записи: слаг у всех типов свой, но и тип не помешает. */
	key: string;
	tags: string[];
}

export interface TagIndex<T extends Taggable = Taggable> {
	tag: string;
	count: number;
	items: T[];
}

export type TaggedEntry =
	| { type: "post"; key: string; tags: string[]; post: Post }
	| { type: "article"; key: string; tags: string[]; article: Article }
	| { type: "project"; key: string; tags: string[]; project: Project };

/**
 * Разбирает список единиц в индекс тегов.
 *
 * Порядок: по убыванию частоты, а при равном счётчике — по алфавиту. Иначе
 * теги переставлялись бы между сборками и страница «моргала» бы сама себе.
 */
export function collectTags<T extends Taggable>(items: T[]): TagIndex<T>[] {
	const buckets = new Map<string, T[]>();

	for (const item of items) {
		// Повтор внутри одной единицы не должен давать ей два одинаковых тега:
		// список приходит из json, где повторы валидатор не запрещает, а
		// счётчик по тегу обязан быть честным.
		for (const raw of new Set(item.tags)) {
			// Пробелы ломают ссылку и выглядят опечаткой, а пустая строка — не
			// тег вовсе.
			const tag = raw.trim();
			if (!tag) continue;

			const bucket = buckets.get(tag);
			if (bucket) bucket.push(item);
			else buckets.set(tag, [item]);
		}
	}

	return [...buckets.entries()]
		.map(([tag, tagged]) => ({ tag, count: tagged.length, items: tagged }))
		.sort(
			(a, b) =>
				b.count - a.count ||
				a.tag.localeCompare(b.tag, undefined, { sensitivity: "base" }),
		);
}

export function taggedEntries(lang: ContentLang = DEFAULT_LANG): TaggedEntry[] {
	return [
		...getPosts(lang).map((post): TaggedEntry => ({
			type: "post",
			key: `post:${post.slug}`,
			tags: post.tags,
			post,
		})),
		...getArticles(lang).map((article): TaggedEntry => ({
			type: "article",
			key: `article:${article.slug}`,
			tags: article.tags,
			article,
		})),
		...getProjects(lang).map((project): TaggedEntry => ({
			type: "project",
			key: `project:${project.slug}`,
			tags: project.tags,
			project,
		})),
	];
}

export function tagIndex(
	lang: ContentLang = DEFAULT_LANG,
): TagIndex<TaggedEntry>[] {
	return collectTags(taggedEntries(lang));
}
