// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it } from "vitest";
import { entryFromFlat, entryFromInput } from "./entry-types.ts";

// NOTE: the boundary where arbitrary JSON becomes an Entry; broken input must not
// fail a save, and empty values are dropped later by `splitEntry`.
describe("entryFromFlat", () => {
	it("splits fields by scope, not by where they came from", () => {
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
		// NOTE: a translatable value without a language means the same for both.
		expect(entry.versions.ru.frontmatter).toEqual({
			title: "Заголовок",
			description: "Описание",
		});
		expect(entry.versions.en.frontmatter).toEqual(
			entry.versions.ru.frontmatter,
		);
	});

	it("a field outside the schema lands in no bag", () => {
		const entry = entryFromFlat("post", "p", { выдумка: 1, title: "T" });

		expect(entry.shared).toEqual({});
		expect(entry.local).toEqual({});
		expect(Object.keys(entry.versions.ru.frontmatter)).toEqual(["title"]);
	});
});

describe("entryFromInput", () => {
	it("garbage input becomes empty instead of failing the save", () => {
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

	it("accepts exactly what loadEntry returned, without loss", () => {
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
