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

/** Переводимые поля: парами RU | EN. */
function fieldRowList(type: Type) {
	return pairRows(type).translated.filter((row) => !row.title);
}

/** Общие поля: по одному на поле, без пары. */
function sharedRowList(type: Type) {
	return pairRows(type).shared.filter((row) => !row.title);
}

describe("разметка полей", () => {
	it("каждое поле встречается в строках ровно один раз", () => {
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

	it("в строке лежит одно и то же поле двух языков", () => {
		const mismatched: string[] = [];
		const empty: string[] = [];

		for (const type of ["post", "article", "project"] as const) {
			for (const row of fieldRowList(type)) {
				// Обе ячейки пустыми быть не могут: строка без полей — мусор.
				if (!row.ru && !row.en) empty.push(type);
				if (row.ru && row.en && row.ru.name !== row.en.name) {
					mismatched.push(`${type}: ${row.ru.name} / ${row.en.name}`);
				}
			}
		}

		expect(empty).toEqual([]);
		expect(mismatched).toEqual([]);
	});

	it("path общий, но только для RU", () => {
		// Путь к клону не переводится и правится один раз — значит общий блок.
		// Но `only: ru` отвечает за файл, поэтому в EN он не попадёт.
		const rows = fieldRowList("project");
		const paired = rows.filter((row) => row.ru?.name === "path");

		expect(paired).toEqual([]);

		const shared = sharedRowList("project");
		expect(shared.some((row) => row.shared?.name === "path")).toBe(true);
	});

	it("все поля схемы попали в строки", () => {
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

	it("заголовок блока не дословно повторяет подпись поля", () => {
		const rows = pairRows("project").translated;
		const titles = new Set(
			rows.filter((r) => r.title).map((r) => r.title?.toLowerCase().trim()),
		);

		// «ОПИСАНИЕ» над полем «Описание» — дословный дубль, который сливается
		// в одно. «Порядок и статус» над полем «Порядок» — не дубль.
		const dupes = rows
			.filter((row) => !row.title)
			.filter((row) => titles.has(row.ru?.label.toLowerCase().trim()))
			.map((row) => row.ru?.label);

		expect(dupes).toEqual([]);
	});

	it("новое поле в схеме не пропадает из формы", () => {
		const rows = pairRows("post").shared;
		const last = rows.at(-1);
		const names = rows
			.filter((row) => row.shared)
			.map((row) => row.shared?.name);

		expect(names).toContain("draft");
		expect(last?.shared).toBeDefined();
	});
});

describe("разделение на переводимое и общее", () => {
	const TYPES = ["post", "article", "project"] as const;

	it("общее поле не попадает в пару RU | EN", () => {
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

	it("общие поля показаны один раз и без пары", () => {
		const bad: string[] = [];

		for (const type of TYPES) {
			for (const row of sharedRowList(type)) {
				if (!row.shared) bad.push(`${type}: строка без поля`);
				// Общее поле рисуется один раз: ни ru, ни en напротив нет.
				if (row.ru) bad.push(`${type}.${row.shared?.name}: лишняя RU`);
				if (row.en) bad.push(`${type}.${row.shared?.name}: лишняя EN`);
			}
		}

		expect(bad).toEqual([]);
	});

	it("каждое поле схемы попало либо в пару, либо в общий блок", () => {
		const lost: string[] = [];

		for (const type of TYPES) {
			const seen = new Set([
				...fieldRowList(type)
					.map((row) => row.ru?.name)
					.filter((n): n is string => Boolean(n)),
				...sharedRowList(type)
					.map((row) => row.shared?.name)
					.filter((n): n is string => Boolean(n)),
			]);

			for (const field of editableFields(type)) {
				if (!seen.has(field.name)) lost.push(`${type}.${field.name}`);
			}
		}

		expect(lost).toEqual([]);
	});

	it("теги, ссылки и статус общие, заголовок и описание переводимые", () => {
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
			expect(shared, `${name} должен быть общим`).toContain(name);
		}

		for (const name of ["title", "subtitle", "description"]) {
			expect(translated, `${name} должен переводиться`).toContain(name);
		}
	});

	it("path — local: не общий и не переводимый", () => {
		// Раньше `path` тащил два флага сразу, `shared` и `only`. Теперь у него
		// один `scope`, и места у него ровно одно.
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

	it("общие поля идут раньше переводимых", () => {
		// Порядок в форме обратный привычному: сверху общее, снизу переводимое.
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
