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

describe("словарь тегов", () => {
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

	it("нет файла — пустой список, а не ошибка", () => {
		expect(readTagRegistry(fixture())).toEqual([]);
	});

	it("добавление пишет файл и держит порядок", () => {
		const root = fixture();

		addTagToRegistry("svelte", root);
		addTagToRegistry("css", root);

		expect(readTagRegistry(root)).toEqual(["css", "svelte"]);
		expect(JSON.parse(fs.readFileSync(file(root), "utf8"))).toEqual({
			tags: ["css", "svelte"],
		});
	});

	it("повторное добавление ничего не ломает", () => {
		const root = fixture();

		addTagToRegistry("css", root);
		addTagToRegistry("css", root);

		expect(readTagRegistry(root)).toEqual(["css"]);
	});

	it("пустой словарь удаляет файл, а не оставляет `{}`", () => {
		const root = fixture();
		addTagToRegistry("css", root);

		removeTagFromRegistry("css", root);

		expect(fs.existsSync(file(root))).toBe(false);
		expect(readTagRegistry(root)).toEqual([]);
	});

	it("переименование в уже существующее имя схлопывает два тега в один", () => {
		const root = fixture();
		addTagToRegistry("css", root);
		addTagToRegistry("css5", root);

		renameTagInRegistry("css5", "css", root);

		expect(readTagRegistry(root)).toEqual(["css"]);
	});

	it("битый файл читается как пустой словарь, а не роняет редактор", () => {
		const root = fixture();
		fs.writeFileSync(file(root), "{ не json", "utf8");

		expect(readTagRegistry(root)).toEqual([]);
	});

	it("мусор внутри файла не попадает в список", () => {
		const root = fixture();
		fs.writeFileSync(
			file(root),
			JSON.stringify({ tags: ["CSS", " css ", "", 42, "a,b", "ok"] }),
			"utf8",
		);

		expect(readTagRegistry(root)).toEqual(["css", "ok"]);
	});

	it("кривое имя не пишется", () => {
		const root = fixture();

		expect(() => addTagToRegistry("a,b", root)).toThrow(/запят/);
		expect(() => addTagToRegistry("  ", root)).toThrow(/пустой/);
		expect(fs.existsSync(file(root))).toBe(false);
	});

	it("проверка наличия не падает на пустом словаре", () => {
		const root = fixture();

		expect(tagInRegistry("css", root)).toBe(false);
		addTagToRegistry("css", root);
		expect(tagInRegistry("CSS", root)).toBe(true);
	});

	it("файл не трогается, пока содержимое то же", () => {
		const root = fixture();
		addTagToRegistry("css", root);
		const before = fs.statSync(file(root)).mtimeMs;

		addTagToRegistry("css", root);

		expect(fs.statSync(file(root)).mtimeMs).toBe(before);
	});
});
