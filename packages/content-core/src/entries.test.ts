// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	createEntry,
	deleteEntry,
	entryExists,
	listEntries,
	loadEntry,
	renameEntry,
	saveEntry,
	splitEntry,
	UnknownFieldError,
} from "./entries.ts";
import { emptyEntry, type Entry } from "./entry-types.ts";
import { localFile, metaFile, unitFile } from "./paths.ts";
import { parseUnit } from "./yaml.ts";
import type { ContentLang, SchemaType } from "./types.ts";
import { CONTENT_LANGS } from "./types.ts";

/*
 * Тесты ходят по настоящей раскладке: пишут файлы в корень репозитория и убирают
 * за собой. Репозиторий считает корень один раз и не умеет переопределить его
 * на время теста, поэтому подменять его через аргумент было бы обходом того,
 * что как раз проверяется.
 */

const TYPE: SchemaType = "post";
const SLUG = "zz-entries-fixture";
const PROJECT_SLUG = "zz-entries-project-fixture";

function entry(over: Partial<Entry> = {}): Entry {
	return { ...emptyEntry(TYPE, SLUG), ...over };
}

function readFile(type: SchemaType, slug: string, lang: ContentLang): string {
	const file = unitFile(type, slug, lang);
	return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readFrontmatter(
	type: SchemaType,
	slug: string,
	lang: ContentLang,
): Record<string, unknown> {
	const raw = readFile(type, slug, lang);
	return raw ? parseUnit(raw).frontmatter : {};
}

function readBody(type: SchemaType, slug: string, lang: ContentLang): string {
	const raw = readFile(type, slug, lang);
	return raw ? parseUnit(raw).body : "";
}

function readJson(file: string): Record<string, Record<string, unknown>> {
	if (!fs.existsSync(file)) return {};
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readMeta(
	type: SchemaType = TYPE,
): Record<string, Record<string, unknown>> {
	return readJson(metaFile(type));
}

function readLocal(
	type: SchemaType = TYPE,
): Record<string, Record<string, unknown>> {
	return readJson(localFile(type));
}

function removeIfEmpty(file: string): void {
	if (!fs.existsSync(file)) return;
	const rest = JSON.parse(fs.readFileSync(file, "utf8"));
	if (Object.keys(rest).length === 0) fs.rmSync(file, { force: true });
}

function cleanup(): void {
	deleteEntry(TYPE, SLUG);
	removeIfEmpty(metaFile(TYPE));
	removeIfEmpty(localFile(TYPE));
}

describe("раскладка по scope", () => {
	beforeEach(cleanup);
	afterAll(cleanup);

	it("переводимое в md, общее в json", async () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "Заголовок";
		input.versions.ru.body = "Тело RU";
		input.versions.en.frontmatter.title = "Title";
		input.versions.en.body = "Body EN";
		input.shared = { date: "2026-09-30", tags: ["a", "b"] };

		await saveEntry(TYPE, SLUG, input);

		expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "Заголовок" });
		expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({ title: "Title" });
		expect(readBody(TYPE, SLUG, "ru")).toBe("Тело RU");
		expect(readBody(TYPE, SLUG, "en")).toBe("Body EN");
		expect(readMeta()[SLUG]).toEqual({
			date: "2026-09-30",
			tags: ["a", "b"],
		});
	});

	it("локальное в .local.json, а не в md", async () => {
		await saveEntry(TYPE, SLUG, entry());
		expect(fs.existsSync(localFile(TYPE))).toBe(false);
	});

	it("общее поле в языковом frontmatter уезжает в json, а не теряется", async () => {
		// Ключевая гарантия: раскладку ведёт scope, а не то, в какой корзине
		// значение пришло. Иначе перенос поля между файлами потребовал бы правки
		// в редакторе.
		const input = entry();
		input.versions.ru.frontmatter.title = "T";
		input.versions.ru.frontmatter.date = "2026-09-30";
		input.versions.ru.frontmatter.tags = ["из ru"];

		await saveEntry(TYPE, SLUG, input);

		expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "T" });
		expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30", tags: ["из ru"] });
	});

	it("переводимое поле в shared уезжает в md, а не теряется", async () => {
		const input = entry();
		input.shared = { date: "2026-09-30", title: "из shared" };

		await saveEntry(TYPE, SLUG, input);

		expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30" });
		expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "из shared" });
		expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({ title: "из shared" });
	});

	it("поле не из схемы падает, а не молча теряется", async () => {
		const input = entry();
		input.shared = { nope: 1 } as never;

		await expect(saveEntry(TYPE, SLUG, input)).rejects.toThrow(
			UnknownFieldError,
		);
	});

	it("splitEntry ничего не пишет на диск", () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "T";
		input.shared = { date: "2026-09-30" };

		const split = splitEntry(TYPE, input);
		expect(split.frontmatter.ru).toEqual({ title: "T" });
		expect(split.shared).toEqual({ date: "2026-09-30" });
		expect(entryExists(TYPE, SLUG)).toBe(false);
	});
});

describe("языковые файлы", () => {
	beforeEach(cleanup);
	afterAll(cleanup);

	it("сохранение создаёт оба файла сразу", async () => {
		const input = entry();
		input.versions.ru.body = "RU";

		await saveEntry(TYPE, SLUG, input);

		for (const lang of CONTENT_LANGS) {
			expect(fs.existsSync(unitFile(TYPE, SLUG, lang))).toBe(true);
		}
	});

	it("en без текста не считается существующим языком", async () => {
		const input = entry();
		input.versions.ru.body = "RU";
		input.versions.en.body = "";

		await saveEntry(TYPE, SLUG, input);

		const [summary] = listEntries(TYPE).filter((item) => item.slug === SLUG);
		expect(summary?.langs).toEqual(["ru"]);
	});

	it("повторное сохранение без изменений не трогает файл", async () => {
		const input = entry();
		input.versions.ru.body = "RU";
		await saveEntry(TYPE, SLUG, input);

		const file = unitFile(TYPE, SLUG, "ru");
		const before = fs.statSync(file).mtimeMs;
		await new Promise((resolve) => setTimeout(resolve, 20));

		const again = await saveEntry(TYPE, SLUG, loadEntry(TYPE, SLUG) as Entry);
		expect(again.written).toEqual([]);
		expect(fs.statSync(file).mtimeMs).toBe(before);
	});
});

describe("чтение и список", () => {
	beforeEach(cleanup);
	afterAll(cleanup);

	it("склеивает три файла в один Entry", async () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "Заголовок";
		input.versions.ru.body = "Тело";
		input.versions.en.frontmatter.title = "Title";
		input.shared = { date: "2026-09-30", tags: ["x"] };

		await saveEntry(TYPE, SLUG, input);
		const loaded = loadEntry(TYPE, SLUG);

		expect(loaded?.versions.ru.frontmatter).toEqual({ title: "Заголовок" });
		expect(loaded?.shared).toEqual({ date: "2026-09-30", tags: ["x"] });
		expect(loaded?.type).toBe(TYPE);
		expect(loaded?.slug).toBe(SLUG);
	});

	it("нет папки — нет Entry", () => {
		expect(loadEntry(TYPE, "zz-absent-fixture")).toBeUndefined();
	});

	it("round-trip сохранить и прочитать", async () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "Заголовок";
		input.versions.ru.body = "Тело RU";
		input.versions.en.frontmatter.title = "Title";
		input.versions.en.frontmatter.needs_translation = true;
		input.versions.en.body = "";
		input.shared = { date: "2026-09-30", draft: true, tags: ["x"] };

		await saveEntry(TYPE, SLUG, input);
		const first = loadEntry(TYPE, SLUG);
		await saveEntry(TYPE, SLUG, first as Entry);

		expect(loadEntry(TYPE, SLUG)).toEqual(first);
	});

	it("список берёт slug из json и из папок", async () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "Из json";
		input.shared = { date: "2026-09-30" };
		await saveEntry(TYPE, SLUG, input);

		const slugs = listEntries(TYPE).map((item) => item.slug);
		expect(slugs).toContain(SLUG);
	});
});

describe("жизненный цикл", () => {
	beforeEach(cleanup);
	afterAll(cleanup);

	it("создание отказывается, если папка уже есть", async () => {
		await createEntry(TYPE, SLUG, entry());
		await expect(createEntry(TYPE, SLUG, entry())).rejects.toThrow(
			/уже существует/,
		);
	});

	it("переименование меняет и папку, и ключ в json", async () => {
		const input = entry();
		input.versions.ru.frontmatter.title = "T";
		input.shared = { date: "2026-09-30" };
		await saveEntry(TYPE, SLUG, input);

		const next = `${SLUG}-renamed`;
		try {
			expect(renameEntry(TYPE, SLUG, next)).toBe(true);
			expect(loadEntry(TYPE, SLUG)).toBeUndefined();
			expect(readMeta()[next]).toEqual({ date: "2026-09-30" });
			expect(readMeta()[SLUG]).toBeUndefined();
			expect(loadEntry(TYPE, next)?.shared).toEqual({
				date: "2026-09-30",
			});
		} finally {
			deleteEntry(TYPE, next);
		}
	});

	it("удаление убирает и папку, и запись в json", async () => {
		const input = entry();
		input.shared = { date: "2026-09-30" };
		await saveEntry(TYPE, SLUG, input);

		expect(deleteEntry(TYPE, SLUG)).toBe(true);
		expect(entryExists(TYPE, SLUG)).toBe(false);
		expect(readMeta()[SLUG]).toBeUndefined();
		expect(deleteEntry(TYPE, SLUG)).toBe(false);
	});

	it("очистка последнего общего поля убирает запись из json", async () => {
		const input = entry();
		input.shared = { date: "2026-09-30" };
		await saveEntry(TYPE, SLUG, input);
		expect(readMeta()[SLUG]).toBeDefined();

		await saveEntry(TYPE, SLUG, entry());

		expect(readMeta()[SLUG]).toBeUndefined();
		expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({});
	});
});

describe("локальные поля", () => {
	afterAll(() => {
		deleteEntry("project", PROJECT_SLUG);
		fs.rmSync(metaFile("project"), { force: true });
		fs.rmSync(localFile("project"), { force: true });
	});

	it("path уезжает в .local.json и не попадает в md и не в json", async () => {
		const input = emptyEntry("project", PROJECT_SLUG);
		input.versions.ru.frontmatter.title = "Проект";
		input.versions.ru.frontmatter.path = "../brul";
		input.shared = { repo: "https://github.com/o/n" };

		await saveEntry("project", PROJECT_SLUG, input);

		expect(readLocal("project")[PROJECT_SLUG]).toEqual({ path: "../brul" });
		// Обычный json знать о машине не должен: он в git.
		expect(readMeta("project")[PROJECT_SLUG]).toEqual({
			repo: "https://github.com/o/n",
		});
		expect(readFrontmatter("project", PROJECT_SLUG, "ru")).toEqual({
			title: "Проект",
		});

		fs.rmSync("src/content/projects/" + PROJECT_SLUG, {
			recursive: true,
			force: true,
		});
	});
});

describe("чужой slug", () => {
	it("невалидный slug отвергается, а не уходит в файловую систему", () => {
		for (const bad of ["../escape", "with space", "a/b", ""]) {
			expect(() => loadEntry(TYPE, bad)).toThrow();
			expect(() => deleteEntry(TYPE, bad)).toThrow();
			expect(() => renameEntry(TYPE, bad, "ok-slug")).toThrow();
		}
	});

	it("tmpdir не используется как база: тесты идут по настоящему корню", () => {
		// Якорь на то, что раскладка общая с репозиторием, а не с временной папкой.
		expect(tmpdir()).not.toBe(metaFile(TYPE).split("src")[0]);
	});
});
