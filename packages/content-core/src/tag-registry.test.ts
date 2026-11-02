// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import * as fs from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { dropFixtureRoots, fixtureRoot } from "./fixture.ts";
import {
	addTagToRegistry,
	readTagRegistry,
	removeTagFromRegistry,
	renameTagInRegistry,
	tagInRegistry,
} from "./tag-registry.ts";

describe("tag dictionary", () => {
	const roots: string[] = [];

	function fixture(): string {
		const root = fixtureRoot();
		roots.push(root);
		return root;
	}

	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
		dropFixtureRoots();
	});

	const file = (root: string) => join(root, "src", "content", "tags.json");

	it("a missing file is an empty list, not an error", () => {
		expect(readTagRegistry(fixture())).toEqual([]);
	});

	it("adding writes the file and keeps order", () => {
		const root = fixture();

		addTagToRegistry("svelte", root);
		addTagToRegistry("css", root);

		expect(readTagRegistry(root)).toEqual(["css", "svelte"]);
		expect(JSON.parse(fs.readFileSync(file(root), "utf8"))).toEqual({
			tags: ["css", "svelte"],
		});
	});

	it("adding twice changes nothing", () => {
		const root = fixture();

		addTagToRegistry("css", root);
		addTagToRegistry("css", root);

		expect(readTagRegistry(root)).toEqual(["css"]);
	});

	it("an empty dictionary deletes the file instead of leaving `{}`", () => {
		const root = fixture();
		addTagToRegistry("css", root);

		removeTagFromRegistry("css", root);

		expect(fs.existsSync(file(root))).toBe(false);
		expect(readTagRegistry(root)).toEqual([]);
	});

	it("renaming onto an existing name collapses two tags into one", () => {
		const root = fixture();
		addTagToRegistry("css", root);
		addTagToRegistry("css5", root);

		renameTagInRegistry("css5", "css", root);

		expect(readTagRegistry(root)).toEqual(["css"]);
	});

	it("a broken file reads as an empty dictionary instead of crashing the editor", () => {
		const root = fixture();
		fs.writeFileSync(file(root), "{ не json", "utf8");

		expect(readTagRegistry(root)).toEqual([]);
	});

	it("garbage inside the file never reaches the list", () => {
		const root = fixture();
		fs.writeFileSync(
			file(root),
			JSON.stringify({ tags: ["CSS", " css ", "", 42, "a,b", "ok"] }),
			"utf8",
		);

		expect(readTagRegistry(root)).toEqual(["css", "ok"]);
	});

	it("an invalid name is not written", () => {
		const root = fixture();

		expect(() => addTagToRegistry("a,b", root)).toThrow(/запят/);
		expect(() => addTagToRegistry("  ", root)).toThrow(/пустой/);
		expect(fs.existsSync(file(root))).toBe(false);
	});

	it("the membership check does not throw on an empty dictionary", () => {
		const root = fixture();

		expect(tagInRegistry("css", root)).toBe(false);
		addTagToRegistry("css", root);
		expect(tagInRegistry("CSS", root)).toBe(true);
	});

	it("the file is untouched while the content is the same", () => {
		const root = fixture();
		addTagToRegistry("css", root);
		const before = fs.statSync(file(root)).mtimeMs;

		addTagToRegistry("css", root);

		expect(fs.statSync(file(root)).mtimeMs).toBe(before);
	});
});
