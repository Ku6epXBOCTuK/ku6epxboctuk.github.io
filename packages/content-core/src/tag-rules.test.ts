// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it } from "vitest";
import { normalizeTag, tagError, tidyTags } from "./tag-rules.ts";

// NOTE: pure tag rules with no fs: the form runs them in the browser, and a drift
// between `normalizeTag` and `tidyTags` would put duplicates into content.
describe("normalizeTag", () => {
	it("trims, drops the hash and lowercases", () => {
		expect(normalizeTag("  #CSS ")).toBe("css");
		expect(normalizeTag("Rust")).toBe("rust");
		expect(normalizeTag("##")).toBe("");
	});
});

describe("tagError", () => {
	it("accepts a normal tag", () => {
		expect(tagError("css")).toBeNull();
		expect(tagError("web-dev")).toBeNull();
	});

	it("catches what would split on save from the form", () => {
		expect(tagError("")).toMatch(/пустой/);
		expect(tagError("a,b")).toMatch(/запят/);
		expect(tagError("a b")).toMatch(/пробел/);
	});
});

describe("tidyTags", () => {
	it("lowercases, drops garbage and duplicates", () => {
		expect(
			tidyTags(["CSS", " css ", "rust", "", 42, "a,b", "web svelte"]),
		).toEqual(["css", "rust"]);
	});

	it("non-array input gives an empty list, not an exception", () => {
		expect(tidyTags("css")).toEqual([]);
		expect(tidyTags(null)).toEqual([]);
		expect(tidyTags([null, undefined, {}])).toEqual([]);
	});

	it("drops the hash: #css and css are one tag", () => {
		expect(tidyTags(["#css", "css"])).toEqual(["css"]);
	});
});
