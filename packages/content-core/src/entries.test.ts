// @vitest-environment node

import * as fs from "node:fs";
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
} from "./entries.ts";
import { dropFixtureRoots, fixtureRoot } from "./fixture.ts";
import { emptyEntry, type Entry } from "./entry-types.ts";
import { localFile, metaFile, unitFile } from "./paths.ts";
import { parseUnit } from "./yaml.ts";
import { isFormatted } from "./format.ts";
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

/**
 * Корень пересоздаётся перед каждым тестом: один запуск не должен видеть
 * файлы предыдущего, а падение посередине не должно оставлять мусор в дереве.
 * Заполняется в `beforeEach`, поэтому вне тестов пуст.
 */
const state: { root: string } = { root: "" };

function fixture(): string {
	if (!state.root) throw new Error("Корень фикстуры не создан");
	return state.root;
}

function entry(over: Partial<Entry> = {}): Entry {
	return { ...emptyEntry(TYPE, SLUG), ...over };
}

function readFile(type: SchemaType, slug: string, lang: ContentLang): string {
	const file = unitFile(type, slug, lang, fixture());
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
	return readJson(metaFile(type, fixture()));
}

function readLocal(
	type: SchemaType = TYPE,
): Record<string, Record<string, unknown>> {
	return readJson(localFile(type, fixture()));
}

describe("репозиторий", () => {
	beforeEach(() => {
		state.root = fixtureRoot();
	});

	afterAll(dropFixtureRoots);

	describe("раскладка по scope", () => {
		it("переводимое в md, общее в json", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "Заголовок";
			input.versions.ru.body = "Тело RU";
			input.versions.en.frontmatter.title = "Title";
			input.versions.en.body = "Body EN";
			input.shared = { date: "2026-09-30", tags: ["a", "b"] };

			await saveEntry(TYPE, SLUG, input, fixture());

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
			await saveEntry(TYPE, SLUG, entry(), fixture());
			expect(fs.existsSync(localFile(TYPE, fixture()))).toBe(false);
		});

		it("файлы после записи устойчивы к prettier", async () => {
			// Иначе `prettier --check` в CI спорил бы с редактором: каждый проход
			// переформатировал бы файл заново и правка жила бы вечно.
			const input = entry();
			input.versions.ru.frontmatter.title = "Заголовок";
			input.versions.ru.body =
				"Очень длинный абзац, который точно превышает ширину печати и будет перенесён prettier при записи, иначе проверка не пройдёт.";
			input.shared = { date: "2026-09-30", tags: ["a"] };

			await saveEntry(TYPE, SLUG, input, fixture());

			for (const lang of CONTENT_LANGS) {
				const raw = readFile(TYPE, SLUG, lang);
				expect(raw).not.toBe("");
				expect(await isFormatted(raw)).toBe(true);
			}
		});

		it("пустой блок frontmatter читается как «полей нет»", async () => {
			await saveEntry(TYPE, SLUG, entry(), fixture());
			const raw = readFile(TYPE, SLUG, "en");

			expect(raw).toContain("---");
			expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({});
			expect(readBody(TYPE, SLUG, "en")).toBe("");
		});

		it("общее поле в языковом frontmatter уезжает в json, а не теряется", async () => {
			// Ключевая гарантия: раскладку ведёт scope, а не то, в какой корзине
			// значение пришло. Иначе перенос поля между файлами потребовал бы правки
			// в редакторе.
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.versions.ru.frontmatter.date = "2026-09-30";
			input.versions.ru.frontmatter.tags = ["из ru"];

			await saveEntry(TYPE, SLUG, input, fixture());

			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "T" });
			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30", tags: ["из ru"] });
		});

		it("переводимое поле в shared уезжает в md, а не теряется", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30", title: "из shared" };

			await saveEntry(TYPE, SLUG, input, fixture());

			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30" });
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "из shared" });
			expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({ title: "из shared" });
		});

		it("поле не из схемы отбрасывается молча", async () => {
			// Сохранение не должно падать из-за значения, которому некуда лечь:
			// теряется одно поле, а человек всё равно правит текст.
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.shared = { date: "2026-09-30", nope: 1 } as never;

			await expect(
				saveEntry(TYPE, SLUG, input, fixture()),
			).resolves.toBeDefined();

			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30" });
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "T" });
		});

		it("splitEntry ничего не пишет на диск", () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.shared = { date: "2026-09-30" };

			const split = splitEntry(TYPE, input);
			expect(split.frontmatter.ru).toEqual({ title: "T" });
			expect(split.shared).toEqual({ date: "2026-09-30" });
			expect(entryExists(TYPE, SLUG, fixture())).toBe(false);
		});
	});

	describe("языковые файлы", () => {
		it("сохранение создаёт оба файла сразу", async () => {
			const input = entry();
			input.versions.ru.body = "RU";

			await saveEntry(TYPE, SLUG, input, fixture());

			for (const lang of CONTENT_LANGS) {
				expect(fs.existsSync(unitFile(TYPE, SLUG, lang, fixture()))).toBe(true);
			}
		});

		it("en без текста не считается существующим языком", async () => {
			const input = entry();
			input.versions.ru.body = "RU";
			input.versions.en.body = "";

			await saveEntry(TYPE, SLUG, input, fixture());

			const [summary] = listEntries(TYPE, fixture()).filter(
				(item) => item.slug === SLUG,
			);
			expect(summary?.langs).toEqual(["ru"]);
		});

		it("повторное сохранение без изменений не трогает файл", async () => {
			const input = entry();
			input.versions.ru.body = "RU";
			await saveEntry(TYPE, SLUG, input, fixture());

			const file = unitFile(TYPE, SLUG, "ru", fixture());
			const before = fs.statSync(file).mtimeMs;
			await new Promise((resolve) => setTimeout(resolve, 20));

			const again = await saveEntry(
				TYPE,
				SLUG,
				loadEntry(TYPE, SLUG, fixture()) as Entry,
				fixture(),
			);
			expect(again.written).toEqual([]);
			expect(fs.statSync(file).mtimeMs).toBe(before);
		});
	});

	describe("чтение и список", () => {
		it("склеивает три файла в один Entry", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "Заголовок";
			input.versions.ru.body = "Тело";
			input.versions.en.frontmatter.title = "Title";
			input.shared = { date: "2026-09-30", tags: ["x"] };

			await saveEntry(TYPE, SLUG, input, fixture());
			const loaded = loadEntry(TYPE, SLUG, fixture());

			expect(loaded?.versions.ru.frontmatter).toEqual({ title: "Заголовок" });
			expect(loaded?.shared).toEqual({ date: "2026-09-30", tags: ["x"] });
			expect(loaded?.type).toBe(TYPE);
			expect(loaded?.slug).toBe(SLUG);
		});

		it("нет папки — нет Entry", () => {
			expect(loadEntry(TYPE, "zz-absent-fixture", fixture())).toBeUndefined();
		});

		it("round-trip сохранить и прочитать", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "Заголовок";
			input.versions.ru.body = "Тело RU";
			input.versions.en.frontmatter.title = "Title";
			input.versions.en.frontmatter.needs_translation = true;
			input.versions.en.body = "";
			input.shared = { date: "2026-09-30", draft: true, tags: ["x"] };

			await saveEntry(TYPE, SLUG, input, fixture());
			const first = loadEntry(TYPE, SLUG, fixture());
			await saveEntry(TYPE, SLUG, first as Entry, fixture());

			expect(loadEntry(TYPE, SLUG, fixture())).toEqual(first);
		});

		it("список берёт slug из json и из папок", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "Из json";
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());

			const slugs = listEntries(TYPE, fixture()).map((item) => item.slug);
			expect(slugs).toContain(SLUG);
		});
	});

	describe("жизненный цикл", () => {
		it("создание отказывается, если папка уже есть", async () => {
			await createEntry(TYPE, SLUG, entry(), fixture());
			await expect(createEntry(TYPE, SLUG, entry(), fixture())).rejects.toThrow(
				/уже существует/,
			);
		});

		it("переименование меняет и папку, и ключ в json", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());

			const next = `${SLUG}-renamed`;
			try {
				expect(renameEntry(TYPE, SLUG, next, fixture())).toBe(true);
				expect(loadEntry(TYPE, SLUG, fixture())).toBeUndefined();
				expect(readMeta()[next]).toEqual({ date: "2026-09-30" });
				expect(readMeta()[SLUG]).toBeUndefined();
				expect(loadEntry(TYPE, next, fixture())?.shared).toEqual({
					date: "2026-09-30",
				});
			} finally {
				deleteEntry(TYPE, next, fixture());
			}
		});

		it("удаление убирает и папку, и запись в json", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());

			expect(deleteEntry(TYPE, SLUG, fixture())).toBe(true);
			expect(entryExists(TYPE, SLUG, fixture())).toBe(false);
			expect(readMeta()[SLUG]).toBeUndefined();
			expect(deleteEntry(TYPE, SLUG, fixture())).toBe(false);
		});

		it("очистка последнего общего поля убирает запись из json", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());
			expect(readMeta()[SLUG]).toBeDefined();

			await saveEntry(TYPE, SLUG, entry(), fixture());

			expect(readMeta()[SLUG]).toBeUndefined();
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({});
		});
	});

	describe("локальные поля", () => {
		afterAll(() => {
			deleteEntry("project", PROJECT_SLUG, fixture());
			fs.rmSync(metaFile("project"), { force: true });
			fs.rmSync(localFile("project"), { force: true });
		});

		it("path уезжает в .local.json и не попадает в md и не в json", async () => {
			const input = emptyEntry("project", PROJECT_SLUG);
			input.versions.ru.frontmatter.title = "Проект";
			input.versions.ru.frontmatter.path = "../brul";
			input.shared = { repo: "https://github.com/o/n" };

			await saveEntry("project", PROJECT_SLUG, input, fixture());

			expect(readLocal("project")[PROJECT_SLUG]).toEqual({ path: "../brul" });
			// Обычный json знать о машине не должен: он в git.
			expect(readMeta("project")[PROJECT_SLUG]).toEqual({
				repo: "https://github.com/o/n",
			});
			expect(readFrontmatter("project", PROJECT_SLUG, "ru")).toEqual({
				title: "Проект",
			});
		});
	});

	describe("чужой slug", () => {
		it("невалидный slug отвергается, а не уходит в файловую систему", () => {
			for (const bad of ["../escape", "with space", "a/b", ""]) {
				expect(() => loadEntry(TYPE, bad, fixture())).toThrow();
				expect(() => deleteEntry(TYPE, bad, fixture())).toThrow();
				expect(() => renameEntry(TYPE, bad, "ok-slug", fixture())).toThrow();
			}
		});

		it("тест пишет в фикстуру, а не в рабочее дерево", () => {
			// Без явного корня тест писал бы в src/content и оставлял бы мусор.
			expect(fixture()).not.toBe("");
			expect(metaFile(TYPE, fixture()).startsWith(fixture())).toBe(true);
		});
	});
});
