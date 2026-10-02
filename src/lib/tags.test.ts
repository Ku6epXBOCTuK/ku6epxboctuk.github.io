import { describe, expect, it } from "vitest";
import { collectTags, type Taggable } from "$lib/tags";

/*
 * Индекс тегов собирается из карточек, и ошибка в нём выглядит как «страница
 * тегов пустая», а не как «поле не прочиталось». Разбирается на простых данных:
 * частоты, порядок, повторы и пустые теги.
 */

function item(type: Taggable["type"], slug: string, tags: string[]): Taggable {
	return { type, key: `${type}:${slug}`, tags };
}

describe("collectTags", () => {
	it("считает один тег, встречающийся в разных типах", () => {
		const index = collectTags([
			item("post", "a", ["css"]),
			item("article", "b", ["css"]),
			item("project", "c", ["css"]),
		]);

		expect(index).toHaveLength(1);
		expect(index[0].tag).toBe("css");
		expect(index[0].count).toBe(3);
		expect(index[0].items.map((i) => i.key)).toEqual([
			"post:a",
			"article:b",
			"project:c",
		]);
	});

	it("сортирует по частоте, а при равной — по алфавиту", () => {
		const index = collectTags([
			item("post", "a", ["rare", "common"]),
			item("post", "b", ["common", "mid"]),
			item("post", "c", ["common", "mid"]),
		]);

		expect(index.map((i) => i.tag)).toEqual(["common", "mid", "rare"]);
	});

	it("один и тот же тег у одной единицы не считается дважды", () => {
		const index = collectTags([item("post", "a", ["css", "css"])]);

		expect(index[0].count).toBe(1);
		expect(index[0].items).toHaveLength(1);
	});

	it("обрезает пробелы и выкидывает пустые теги", () => {
		const index = collectTags([item("post", "a", [" svelte ", "", "   "])]);

		expect(index.map((i) => i.tag)).toEqual(["svelte"]);
	});

	it("регистр не сливает теги молча", () => {
		const index = collectTags([
			item("post", "a", ["CSS"]),
			item("post", "b", ["css"]),
		]);

		expect(index).toHaveLength(2);
	});

	it("пустой контент даёт пустой индекс, а не ошибку", () => {
		expect(collectTags([])).toEqual([]);
	});
});
