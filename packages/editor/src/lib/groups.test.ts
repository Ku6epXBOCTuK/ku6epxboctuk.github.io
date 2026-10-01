// @vitest-environment node

import { describe, expect, it } from "vitest";
import { FIELDS } from "@ku6epxboctuk/content-core/shared";
import { fieldRows } from "./groups.ts";

function fieldsFor(type: "post" | "article" | "project", lang: "ru" | "en") {
	return FIELDS[type].filter(
		(field) =>
			!field.hidden &&
			!field.auto &&
			!field.shared &&
			(!field.only || field.only === lang),
	);
}

function pairRows(type: "post" | "article" | "project") {
	return fieldRows(type, fieldsFor(type, "ru"), fieldsFor(type, "en"));
}

/** Переводимые поля: парами RU | EN. */
function fieldRowList(type: "post" | "article" | "project") {
	return pairRows(type).translated.filter((row) => !row.title);
}

/** Общие поля: по одному на поле, без пары. */
function sharedRowList(type: "post" | "article" | "project") {
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

			for (const field of fieldsFor(type, "ru")) {
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
				const shared = names.filter(
					(name) => FIELDS[type].find((f) => f.name === name)?.shared,
				);
				if (shared.length > 0) leaked.push(`${type}.${shared.join(",")}`);
			}
		}

		expect(leaked).toEqual([]);
	});

	it("общие поля показаны один раз и без пары", () => {
		for (const type of TYPES) {
			const rows = sharedRowList(type);

			for (const row of rows) {
				expect(row.shared, `${type}: строка без поля`).toBeDefined();
				// Общее поле рисуется один раз: ни ru, ни en напротив нет.
				expect(
					row.ru,
					`${type}.${row.shared?.name}: лишняя RU`,
				).toBeUndefined();
				expect(
					row.en,
					`${type}.${row.shared?.name}: лишняя EN`,
				).toBeUndefined();
			}
		}
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

			for (const field of FIELDS[type]) {
				if (field.hidden || field.auto) continue;
				if (!seen.has(field.name)) lost.push(`${type}.${field.name}`);
			}
		}

		expect(lost).toEqual([]);
	});

	it("теги, ссылки и статус помечены общими, заголовок и описание — нет", () => {
		const project = FIELDS.project;
		// Проверяем «общее» vs «не общее», а не конкретное значение флага: у
		// переводимых полей флаг просто не выставлен, это `undefined`.
		const isShared = (name: string) =>
			Boolean(project.find((f) => f.name === name)?.shared);

		for (const name of [
			"tags",
			"repo",
			"homepage",
			"status",
			"order",
			"draft",
		]) {
			expect(isShared(name), `${name} должен быть общим`).toBe(true);
		}

		for (const name of ["title", "subtitle", "description", "image"]) {
			expect(isShared(name), `${name} должен переводиться`).toBe(false);
		}
	});

	it("shared и only вместе — это path: правится один раз, пишется в RU", () => {
		// Раньше это считалось противоречием. На деле `shared` отвечает за то,
		// сколько раз поле рисуется, а `only` — в какой файл попадёт значение.
		// Путь к клону именно такой: одна форма ввода, ноль копий в EN.
		const both = FIELDS.project.filter((f) => f.shared && f.only);

		expect(both.map((f) => f.name)).toEqual(["path"]);
		expect(both[0]?.only).toBe("ru");
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
