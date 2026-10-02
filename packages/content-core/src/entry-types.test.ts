// @vitest-environment node

import { describe, expect, it } from "vitest";
import { entryFromFlat, entryFromInput } from "./entry-types.ts";

/*
 * Граница, где произвольный JSON превращается в `Entry`. Здесь важно не то,
 * какие поля выживут, а то, что репозиторий дальше получает запись, а не
 * мусор: сломанный вход не должен ронять сохранение, а пустые значения не
 * должны попадать на диск (это уже делает `splitEntry`).
 */

describe("entryFromFlat", () => {
	it("разносит поля по scope, а не по тому, откуда они пришли", () => {
		const entry = entryFromFlat("project", "p", {
			title: "Заголовок",
			description: "Описание",
			repo: "https://github.com/o/n",
			tags: ["a"],
			path: "../n",
			неизвестное: "значение",
		});

		expect(entry.shared).toEqual({
			repo: "https://github.com/o/n",
			tags: ["a"],
		});
		expect(entry.local).toEqual({ path: "../n" });
		// Переводимое без языка значит «одно на оба».
		expect(entry.versions.ru.frontmatter).toEqual({
			title: "Заголовок",
			description: "Описание",
		});
		expect(entry.versions.en.frontmatter).toEqual(
			entry.versions.ru.frontmatter,
		);
	});

	it("поле вне схемы не попадает ни в одну корзину", () => {
		const entry = entryFromFlat("post", "p", { выдумка: 1, title: "T" });

		expect(entry.shared).toEqual({});
		expect(entry.local).toEqual({});
		expect(Object.keys(entry.versions.ru.frontmatter)).toEqual(["title"]);
	});
});

describe("entryFromInput", () => {
	it("мусор на входе заменяется пустым, а не роняет сохранение", () => {
		const entry = entryFromInput("post", "p", {
			shared: "не объект",
			local: [1, 2],
			versions: { ru: { frontmatter: null, body: 42 }, en: "нет" },
		});

		expect(entry.shared).toEqual({});
		expect(entry.local).toEqual({});
		expect(entry.versions.ru).toEqual({ frontmatter: {}, body: "" });
		expect(entry.versions.en).toEqual({ frontmatter: {}, body: "" });
	});

	it("принимает ровно то, что вернул loadEntry, без потерь", () => {
		const original = entryFromFlat("project", "p", {
			title: "T",
			repo: "https://github.com/o/n",
			path: "../n",
		});
		original.versions.ru.body = "Текст";
		original.versions.en.body = "Text";

		const round = entryFromInput(
			"project",
			"p",
			JSON.parse(JSON.stringify(original)),
		);

		expect(round).toEqual(original);
	});
});
