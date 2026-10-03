// @vitest-environment node

import { describe, expect, it } from "vitest";
import { normalizeTag, tagError, tidyTags } from "./tag-rules.ts";

/*
 * Правила тегов. Всё чистое, без файловой системы: эти функции работают прямо в
 * браузере формы, и каждая из них определяет, чем один тег отличается от
 * другого. Если `normalizeTag` и `tidyTags` разойдутся, в контент попадут дубли.
 */

describe("normalizeTag", () => {
	it("триммит, снимает решётку и приводит к нижнему регистру", () => {
		expect(normalizeTag("  #CSS ")).toBe("css");
		expect(normalizeTag("Rust")).toBe("rust");
		expect(normalizeTag("##")).toBe("");
	});
});

describe("tagError", () => {
	it("пропускает обычный тег", () => {
		expect(tagError("css")).toBeNull();
		expect(tagError("web-dev")).toBeNull();
	});

	it("ловит то, что распалось бы при сохранении из формы", () => {
		expect(tagError("")).toMatch(/пустой/);
		expect(tagError("a,b")).toMatch(/запят/);
		expect(tagError("a b")).toMatch(/пробел/);
	});
});

describe("tidyTags", () => {
	it("приводит к нижнему регистру, убирает мусор и повторы", () => {
		expect(
			tidyTags(["CSS", " css ", "rust", "", 42, "a,b", "web svelte"]),
		).toEqual(["css", "rust"]);
	});

	it("не мусорный вход даёт пустой список, а не исключение", () => {
		expect(tidyTags("css")).toEqual([]);
		expect(tidyTags(null)).toEqual([]);
		expect(tidyTags([null, undefined, {}])).toEqual([]);
	});

	it("убирает решётку: #css и css — один тег", () => {
		expect(tidyTags(["#css", "css"])).toEqual(["css"]);
	});
});
