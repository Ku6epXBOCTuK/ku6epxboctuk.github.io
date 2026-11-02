// NOTE: these tests need the node environment, not a DOM.
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

// NOTE: the tests use the real layout in a fixture root and clean up after
// themselves; `repoRoot()` is computed once, so passing a root explicitly is the
// only way to avoid writing into the working tree.
const TYPE: SchemaType = "post";
const SLUG = "zz-entries-fixture";
const PROJECT_SLUG = "zz-entries-project-fixture";

// NOTE: the root is recreated before every test, so a run never sees the previous
// files and a mid-test crash leaves no litter; set in `beforeEach`.
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

describe("repository", () => {
	beforeEach(() => {
		state.root = fixtureRoot();
	});

	afterAll(dropFixtureRoots);

	describe("layout by scope", () => {
		it("translatable in md, shared in json", async () => {
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

		it("local goes in .local.json, not md", async () => {
			await saveEntry(TYPE, SLUG, entry(), fixture());
			expect(fs.existsSync(localFile(TYPE, fixture()))).toBe(false);
		});

		it("written files are stable under prettier", async () => {
			// NOTE: otherwise `prettier --check` in CI would fight the editor and
			// rewrite the file on every run.
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

		it("an empty frontmatter block reads as no fields", async () => {
			await saveEntry(TYPE, SLUG, entry(), fixture());
			const raw = readFile(TYPE, SLUG, "en");

			expect(raw).toContain("---");
			expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({});
			expect(readBody(TYPE, SLUG, "en")).toBe("");
		});

		it("a shared field in frontmatter lands in json, not lost", async () => {
			// NOTE: layout follows scope, not the bag a value arrived in; otherwise
			// moving a field would require editor changes.
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.versions.ru.frontmatter.date = "2026-09-30";
			input.versions.ru.frontmatter.tags = ["из ru"];

			await saveEntry(TYPE, SLUG, input, fixture());

			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "T" });
			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30", tags: ["из ru"] });
		});

		it("a translatable field in shared lands in md, not lost", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30", title: "из shared" };

			await saveEntry(TYPE, SLUG, input, fixture());

			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30" });
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "из shared" });
			expect(readFrontmatter(TYPE, SLUG, "en")).toEqual({ title: "из shared" });
		});

		it("a field outside the schema is dropped silently", async () => {
			// NOTE: a save must not fail over a value with nowhere to go; one field
			// is lost while the text is still edited.
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.shared = { date: "2026-09-30", nope: 1 } as never;

			await expect(
				saveEntry(TYPE, SLUG, input, fixture()),
			).resolves.toBeDefined();

			expect(readMeta()[SLUG]).toEqual({ date: "2026-09-30" });
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({ title: "T" });
		});

		it("splitEntry writes nothing to disk", () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "T";
			input.shared = { date: "2026-09-30" };

			const split = splitEntry(TYPE, input);
			expect(split.frontmatter.ru).toEqual({ title: "T" });
			expect(split.shared).toEqual({ date: "2026-09-30" });
			expect(entryExists(TYPE, SLUG, fixture())).toBe(false);
		});

		it("a translatable field of one language does not bleed into the other", () => {
			// NOTE: `needs_translation` is true only on EN; in a both-languages
			// baseline the RU file would lie and the editor would not show it.
			const input = entry();
			input.versions.ru.frontmatter.title = "Заголовок";
			input.versions.en.frontmatter = {
				title: "Title",
				needs_translation: true,
			};

			const split = splitEntry(TYPE, input);
			expect(split.frontmatter.ru).toEqual({ title: "Заголовок" });
			expect(split.frontmatter.en).toEqual({
				title: "Title",
				needs_translation: true,
			});
		});

		it("a translatable field in the shared bag still reads as both languages", () => {
			// NOTE: the other side of the previous rule: a value in the wrong file
			// applies to both languages, or the rescue rule would be pointless.
			const input = entry();
			input.shared = { date: "2026-09-30", title: "Один на всех" };

			const split = splitEntry(TYPE, input);
			expect(split.frontmatter.ru).toEqual({ title: "Один на всех" });
			expect(split.frontmatter.en).toEqual({ title: "Один на всех" });
			expect(split.shared).toEqual({ date: "2026-09-30" });
		});
	});

	describe("language files", () => {
		it("saving creates both files at once", async () => {
			const input = entry();
			input.versions.ru.body = "RU";

			await saveEntry(TYPE, SLUG, input, fixture());

			for (const lang of CONTENT_LANGS) {
				expect(fs.existsSync(unitFile(TYPE, SLUG, lang, fixture()))).toBe(true);
			}
		});

		it("an empty en does not count as an existing language", async () => {
			const input = entry();
			input.versions.ru.body = "RU";
			input.versions.en.body = "";

			await saveEntry(TYPE, SLUG, input, fixture());

			const [summary] = listEntries(TYPE, fixture()).filter(
				(item) => item.slug === SLUG,
			);
			expect(summary?.langs).toEqual(["ru"]);
		});

		it("saving again without changes leaves the file alone", async () => {
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

	describe("reading and listing", () => {
		it("glues the three files into one Entry", async () => {
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

		it("no folder means no Entry", () => {
			expect(loadEntry(TYPE, "zz-absent-fixture", fixture())).toBeUndefined();
		});

		it("save and read round trip", async () => {
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

		it("the list takes slugs from json and folders", async () => {
			const input = entry();
			input.versions.ru.frontmatter.title = "Из json";
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());

			const slugs = listEntries(TYPE, fixture()).map((item) => item.slug);
			expect(slugs).toContain(SLUG);
		});
	});

	describe("lifecycle", () => {
		it("create refuses when the folder already exists", async () => {
			await createEntry(TYPE, SLUG, entry(), fixture());
			await expect(createEntry(TYPE, SLUG, entry(), fixture())).rejects.toThrow(
				/уже существует/,
			);
		});

		it("rename moves the folder and the json key", async () => {
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

		it("delete removes the folder and the json record", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());

			expect(deleteEntry(TYPE, SLUG, fixture())).toBe(true);
			expect(entryExists(TYPE, SLUG, fixture())).toBe(false);
			expect(readMeta()[SLUG]).toBeUndefined();
			expect(deleteEntry(TYPE, SLUG, fixture())).toBe(false);
		});

		it("clearing the last shared field removes the json record", async () => {
			const input = entry();
			input.shared = { date: "2026-09-30" };
			await saveEntry(TYPE, SLUG, input, fixture());
			expect(readMeta()[SLUG]).toBeDefined();

			await saveEntry(TYPE, SLUG, entry(), fixture());

			expect(readMeta()[SLUG]).toBeUndefined();
			expect(readFrontmatter(TYPE, SLUG, "ru")).toEqual({});
		});
	});

	describe("local fields", () => {
		afterAll(() => {
			deleteEntry("project", PROJECT_SLUG, fixture());
			fs.rmSync(metaFile("project", fixture()), { force: true });
			fs.rmSync(localFile("project", fixture()), { force: true });
		});

		it("path lands in .local.json, not in md and not in json", async () => {
			const input = emptyEntry("project", PROJECT_SLUG);
			input.versions.ru.frontmatter.title = "Проект";
			input.versions.ru.frontmatter.path = "../example-repo";
			input.shared = { repo: "https://github.com/o/n" };

			await saveEntry("project", PROJECT_SLUG, input, fixture());

			expect(readLocal("project")[PROJECT_SLUG]).toEqual({
				path: "../example-repo",
			});
			// NOTE: the plain json must not know about the machine; it is committed.
			expect(readMeta("project")[PROJECT_SLUG]).toEqual({
				repo: "https://github.com/o/n",
			});
			expect(readFrontmatter("project", PROJECT_SLUG, "ru")).toEqual({
				title: "Проект",
			});
		});
	});

	describe("foreign slug", () => {
		it("an invalid slug is rejected, not passed to the filesystem", () => {
			for (const bad of ["../escape", "with space", "a/b", ""]) {
				expect(() => loadEntry(TYPE, bad, fixture())).toThrow();
				expect(() => deleteEntry(TYPE, bad, fixture())).toThrow();
				expect(() => renameEntry(TYPE, bad, "ok-slug", fixture())).toThrow();
			}
		});

		it("the test writes into a fixture, not the working tree", () => {
			// NOTE: without an explicit root the test would write into src/content
			// and leave litter.
			expect(fixture()).not.toBe("");
			expect(metaFile(TYPE, fixture()).startsWith(fixture())).toBe(true);
		});
	});
});
