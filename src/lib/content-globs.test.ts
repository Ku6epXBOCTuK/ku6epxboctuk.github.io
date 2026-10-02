import { describe, expect, it } from "vitest";
import { getArticles } from "$lib/articles";
import { getPosts } from "$lib/posts";
import { getProjects } from "$lib/projects";
import { articleRawModules, modulesOf, sharedOf } from "$lib/content-globs";
import { CONTENT_TYPES } from "@ku6epxboctuk/content-core/shared";

/*
 * Таблица глобов — единственное место, где перечислены пути. Ошибка в ней
 * выглядит как «страница пустая», а не как «не найдено поле», поэтому её надо
 * проверить явно: для каждого типа таблица должна видеть столько же модулей и
 * общих записей, сколько их на диске.
 *
 * Моки лежат в `src/content-mocks` и генерируются скриптом, поэтому при пустом
 * дереве проверка схлопывается — это видно по `describe.skip`.
 */

const hasMocks = Object.keys(modulesOf("post")).length > 0;

describe.skipIf(!hasMocks)("таблица глобов", () => {
	it.each(CONTENT_TYPES)("%s: модули и общие записи по одному slug", (type) => {
		const modules = Object.keys(modulesOf(type));
		const shared = Object.keys(sharedOf(type));

		expect(modules.length).toBeGreaterThan(0);
		expect(shared.length).toBeGreaterThan(0);

		// Сколько папок, столько и языковых файлов на каждую.
		const slugs = new Set(
			modules.map((path) => path.split("/").slice(-2, -1)[0] ?? ""),
		);
		expect(modules.length).toBe(slugs.size * 2);
	});

	it("у каждого типа есть и общие записи, и языковые файлы", () => {
		// Расхождение означает, что glob нашёл md без json: даты и теги молча
		// пропадут, и заметить это можно только глазами.
		for (const type of CONTENT_TYPES) {
			const slugsFromModules = new Set(
				Object.keys(modulesOf(type)).map(
					(path) => path.split("/").slice(-2, -1)[0] ?? "",
				),
			);
			const slugsFromShared = new Set(Object.keys(sharedOf(type)));

			expect(
				[...slugsFromShared].every((slug) => slugsFromModules.has(slug)),
				`${type}: запись в json без папки`,
			).toBe(true);
		}
	});

	it("время чтения считается по тем же статьям", () => {
		expect(Object.keys(articleRawModules).length).toBe(
			Object.keys(modulesOf("article")).length,
		);
	});

	it("контент виден загрузчикам с общими полями", () => {
		expect(getPosts("ru")[0]?.date).toMatch(/^20\d\d-\d\d-\d\d$/);
		expect(getArticles("ru")[0]?.date).toMatch(/^20\d\d-\d\d-\d\d$/);
		expect(getProjects("ru")[0]?.repo).toMatch(/^https:\/\//);
	});
});
