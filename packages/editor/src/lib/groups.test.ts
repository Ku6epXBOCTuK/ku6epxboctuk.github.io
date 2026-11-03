// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	editableFields,
	fieldsByScope,
} from "@ku6epxboctuk/content-core/shared";
import { fieldRows } from "./groups.ts";

type Type = "post" | "article" | "project";

const translatable = (type: Type) => fieldsByScope(type, "translatable");

function pairRows(type: Type) {
	return fieldRows(type, translatable(type), translatable(type));
}

function fieldRowList(type: Type) {
	return pairRows(type).translated.filter((row) => !row.title);
}

function sharedRowList(type: Type) {
	return pairRows(type).shared.filter((row) => !row.title);
}

function localRowList(type: Type) {
	return pairRows(type).local.filter((row) => !row.title);
}

describe("field layout", () => {
	it("each field appears in a row exactly once", () => {
		const doubled: string[] = [];

		for (const type of ["post", "article", "project"] as const) {
			const names = fieldRowList(type).map(
				(row) => row.ru?.name ?? row.en?.name,
			);

			for (const name of new Set(names)) {
				const count = names.filter((item) => item === name).length;
				if (count > 1) doubled.push(`${type}.${name} ×${count}`);
			}
		}

		expect(doubled).toEqual([]);
	});

	it("a row holds one field across both languages", () => {
		const mismatched: string[] = [];
		const empty: string[] = [];

		for (const type of ["post", "article", "project"] as const) {
			for (const row of fieldRowList(type)) {
				if (!row.ru && !row.en) empty.push(type);
				if (row.ru && row.en && row.ru.name !== row.en.name) {
					mismatched.push(`${type}: ${row.ru.name} / ${row.en.name}`);
				}
			}
		}

		expect(empty).toEqual([]);
		expect(mismatched).toEqual([]);
	});

	it("path is local, neither shared nor translatable", () => {
		const paired = fieldRowList("project").filter(
			(row) => row.ru?.name === "path",
		);
		expect(paired).toEqual([]);

		expect(
			sharedRowList("project").some((row) => row.shared?.name === "path"),
		).toBe(false);

		expect(
			localRowList("project").some((row) => row.shared?.name === "path"),
		).toBe(true);
	});

	it("every schema field lands in a row", () => {
		const missing: string[] = [];

		for (const type of ["post", "article", "project"] as const) {
			const got = new Set(
				fieldRowList(type)
					.map((row) => row.ru?.name)
					.filter((name): name is string => Boolean(name)),
			);

			for (const field of translatable(type)) {
				if (!got.has(field.name)) missing.push(`${type}.${field.name}`);
			}
		}

		expect(missing).toEqual([]);
	});

	it("a section title does not repeat a field label verbatim", () => {
		const rows = pairRows("project").translated;
		const titles = new Set(
			rows.filter((r) => r.title).map((r) => r.title?.toLowerCase().trim()),
		);
		const dupes = rows
			.filter((row) => !row.title)
			.filter((row) => titles.has(row.ru?.label.toLowerCase().trim()))
			.map((row) => row.ru?.label);

		expect(dupes).toEqual([]);
	});

	it("a new schema field does not disappear from the form", () => {
		const rows = pairRows("post").shared;
		const last = rows.at(-1);
		const names = rows
			.filter((row) => row.shared)
			.map((row) => row.shared?.name);

		expect(names).toContain("draft");
		expect(last?.shared).toBeDefined();
	});
});

describe("translatable and shared split", () => {
	const TYPES = ["post", "article", "project"] as const;

	it("a shared field does not land in a RU | EN pair", () => {
		const leaked: string[] = [];

		for (const type of TYPES) {
			for (const row of fieldRowList(type)) {
				const names = [row.ru?.name, row.en?.name].filter(Boolean);
				const notTranslated = names.filter((name) =>
					fieldsByScope(type, "translatable").every(
						(field) => field.name !== name,
					),
				);
				if (notTranslated.length > 0)
					leaked.push(`${type}.${notTranslated.join(",")}`);
			}
		}

		expect(leaked).toEqual([]);
	});

	it("shared fields render once and without a pair", () => {
		const bad: string[] = [];

		for (const type of TYPES) {
			for (const row of sharedRowList(type)) {
				if (!row.shared) bad.push(`${type}: row without a field`);
				if (row.ru) bad.push(`${type}.${row.shared?.name}: stray RU`);
				if (row.en) bad.push(`${type}.${row.shared?.name}: stray EN`);
			}
		}

		expect(bad).toEqual([]);
	});

	it("every schema field lands in a pair, shared or local row", () => {
		const lost: string[] = [];

		for (const type of TYPES) {
			const seen = new Set([
				...fieldRowList(type)
					.map((row) => row.ru?.name)
					.filter((n): n is string => Boolean(n)),
				...sharedRowList(type)
					.map((row) => row.shared?.name)
					.filter((n): n is string => Boolean(n)),
				...localRowList(type)
					.map((row) => row.shared?.name)
					.filter((n): n is string => Boolean(n)),
			]);

			for (const field of editableFields(type)) {
				if (!seen.has(field.name)) lost.push(`${type}.${field.name}`);
			}
		}

		expect(lost).toEqual([]);
	});

	it("tags, links and status are shared, title and description translatable", () => {
		const shared = fieldsByScope("project", "shared").map((f) => f.name);
		const translated = fieldsByScope("project", "translatable").map(
			(f) => f.name,
		);

		for (const name of [
			"tags",
			"repo",
			"homepage",
			"status",
			"order",
			"draft",
			"image",
		]) {
			expect(shared, `${name} should be shared`).toContain(name);
		}

		for (const name of ["title", "subtitle", "description"]) {
			expect(translated, `${name} should be translatable`).toContain(name);
		}
	});

	it("path is local: neither shared nor translatable", () => {
		expect(fieldsByScope("project", "local").map((f) => f.name)).toEqual([
			"path",
		]);
		expect(fieldsByScope("project", "shared").map((f) => f.name)).not.toContain(
			"path",
		);
		expect(
			fieldsByScope("project", "translatable").map((f) => f.name),
		).not.toContain("path");
	});

	it("shared fields come before translatable ones", () => {
		const rows = pairRows("project");
		const names = [...rows.shared, ...rows.translated]
			.filter((row) => row.shared || row.ru)
			.map((row) => row.shared?.name ?? row.ru?.name);

		const lastShared = names.lastIndexOf("draft");
		const firstTranslated = names.indexOf("title");

		expect(lastShared).toBeGreaterThan(-1);
		expect(firstTranslated).toBeGreaterThan(lastShared);
	});
});
