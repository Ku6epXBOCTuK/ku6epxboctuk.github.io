// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import * as fs from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { validateContent } from "./validate.ts";
import { repoRoot } from "./paths.ts";

// NOTE: validation checks the layout, so the fixture copies it whole: both
// schemas, type folders and `<type>s.json` files.
const REPO = repoRoot();

const ARTICLE = ["title: Статья"];
const POST = ["title: Пост"];
const PROJECT = ["title: Проект", "description: Описание"];

interface Fixture {
	files: Record<string, string>;
	json?: Record<string, unknown>;
	local?: Record<string, unknown>;
}

const roots: string[] = [];

function dropRoots(): void {
	for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	roots.length = 0;
}

function build(files: Record<string, string>): string {
	const root = fs.mkdtempSync(`${process.env.TEMP ?? "."}/content-validate-`);
	roots.push(root);

	for (const schema of ["frontmatter.json", "content.schema.json"]) {
		fs.copyFileSync(`${REPO}/${schema}`, `${root}/${schema}`);
	}

	for (const type of ["posts", "articles", "projects", "weekly"]) {
		fs.mkdirSync(`${root}/src/content/${type}`, { recursive: true });
	}

	for (const [rel, text] of Object.entries(files)) {
		const file = `${root}/src/content/${rel}`;
		fs.mkdirSync(file.replace(/[^/\\]+$/, ""), { recursive: true });
		fs.writeFileSync(file, text, "utf8");
	}

	return root;
}

function tree(fixture: Fixture) {
	const files: Record<string, string> = { ...fixture.files };

	for (const [name, records] of Object.entries(fixture.json ?? {})) {
		files[name] = `${JSON.stringify(records, null, "\t")}\n`;
	}
	for (const [name, records] of Object.entries(fixture.local ?? {})) {
		files[name] = `${JSON.stringify(records, null, "\t")}\n`;
	}

	return validateContent(build(files));
}

function md(lines: string[], body: string): string {
	return `---\n${lines.join("\n")}\n---\n\n${body}\n`;
}

function pair(
	dir: string,
	ru: string[],
	en: string[],
	ruBody = "Б",
	enBody = "B",
): Record<string, string> {
	return {
		[`${dir}/index.ru.md`]: md(ru, ruBody),
		[`${dir}/index.en.md`]: md(en, enBody),
	};
}

describe("validation", () => {
	afterAll(dropRoots);

	it("a clean tree reports nothing", () => {
		const result = tree({
			files: {
				...pair(
					"articles/ok",
					ARTICLE,
					ARTICLE,
					"Текст.\n\n<!--more-->",
					"Text.\n\n<!--more-->",
				),
				...pair("posts/ok", POST, POST),
				...pair("projects/ok", PROJECT, PROJECT),
				...pair(
					"weekly/2026-09-22",
					["title: Неделя", "excerpt: Итог"],
					["title: Week", "excerpt: Summary"],
				),
			},
			json: {
				"posts.json": { ok: { date: "2026-09-30", image: "/images/x.webp" } },
				"articles.json": { ok: { date: "2026-09-30" } },
				"projects.json": { ok: { repo: "https://github.com/o/n" } },
				"weekly.json": { "2026-09-22": { date: "2026-09-22" } },
			},
		});

		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
	});

	describe("folder without files", () => {
		it("a folder without language md is a warning, not an error", () => {
			// NOTE: a folder with no `index.*.md` is litter, but worth a warning:
			// the unit likely failed to be created. A non-md file stands in so the
			// fixture can make a non-empty folder.
			const result = tree({ files: { "posts/ghost/notes.txt": "мусор" } });

			expect(result.errors).toEqual([]);
			expect(
				result.warnings.some((line) => /ghost.*папка без/.test(line)),
			).toBe(true);
		});

		it("a folder with a foreign md is an error: no language files", () => {
			const result = tree({ files: { "posts/ghost/README.md": "мусор" } });

			expect(
				result.errors.some((line) => /missing index\..*\.md/.test(line)),
			).toBe(true);
		});

		it("a json record without a folder is an error", () => {
			// NOTE: the other side: a record visible in json does not excuse an
			// empty folder, or the site gets a card without text.
			const result = tree({
				json: { "posts.json": { ghost: { date: "2026-09-30" } } },
			});

			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe("keeping the files aligned", () => {
		it("a shared field in frontmatter names the right file", () => {
			const result = tree({
				files: pair("posts/x", ["title: T", "date: 2026-09-30"], POST),
			});

			const found = result.errors.find((line) => /"date"/.test(line));
			expect(found).toBeDefined();
			expect(found).toContain("not translatable");
			expect(found).toContain("posts.json");
		});

		it("a local field in frontmatter is banned too", () => {
			const result = tree({
				files: pair(
					"projects/x",
					["title: T", "description: D", "path: ../example-repo"],
					["title: T", "description: D"],
				),
			});

			expect(
				result.errors.some((line) => /"path".*local\.json/.test(line)),
			).toBe(true);
		});

		it("a translatable field in json is an error", () => {
			const result = tree({
				files: pair("posts/x", POST, POST),
				json: { "posts.json": { x: { title: "Лишнее" } } },
			});

			expect(
				result.errors.some((line) =>
					/posts\.json.*unknown field "title"/.test(line),
				),
			).toBe(true);
		});

		it("a json record without a folder is an error", () => {
			const result = tree({
				files: pair("posts/ok", POST, POST),
				json: {
					"posts.json": { ok: { date: "2026-09-30" }, ghost: { draft: true } },
				},
			});

			expect(result.errors.some((line) => /ghost.*нет папки/.test(line))).toBe(
				true,
			);
		});

		it("a required json field is checked", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				json: { "projects.json": { x: {} } },
			});

			expect(
				result.errors.some((line) =>
					/projects\.json.*missing required field "repo"/.test(line),
				),
			).toBe(true);
		});

		it("a json field type is checked", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				json: { "projects.json": { x: { repo: "r", order: "много" } } },
			});

			expect(
				result.errors.some((line) => /order.*must be a number/.test(line)),
			).toBe(true);
		});

		it("choice is checked against its list", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				json: { "projects.json": { x: { repo: "r", status: "nope" } } },
			});

			expect(
				result.errors.some((line) => /status.*must be one of/.test(line)),
			).toBe(true);
		});

		it("local json is checked apart from shared", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				local: { "projects.local.json": { x: { path: 42 } } },
			});

			expect(
				result.errors.some((line) => /\.local\.json.*path/.test(line)),
			).toBe(true);
		});
	});

	const errors: Array<[string, Fixture, RegExp]> = [
		[
			"unknown field",
			{ files: pair("posts/x", [...POST, "nope: 1"], POST) },
			/unknown field "nope"/,
		],
		[
			"missing required",
			{ files: pair("posts/x", [], POST) },
			/missing required field "title"/,
		],
		[
			"wrong field type",
			{ files: pair("posts/x", [...POST, "needs_translation: да"], POST) },
			/field "needs_translation" must be a boolean/,
		],
		[
			"non-ISO date in json",
			{
				files: pair("weekly/x", ["title: T"], ["title: T"]),
				json: { "weekly.json": { x: { date: "30.09.2026" } } },
			},
			/must be ISO YYYY-MM-DD/,
		],
		[
			"no marker in the article",
			{ files: pair("articles/x", ARTICLE, ARTICLE, "Текст.", "<!--more-->") },
			/article must contain/,
		],
		[
			"needs_translation in ru",
			{ files: pair("posts/x", [...POST, "needs_translation: true"], POST) },
			/only allowed in index\.en\.md/,
		],
		[
			"no en",
			{ files: { "posts/x/index.ru.md": md(POST, "Б") } },
			/missing index\.en\.md/,
		],
		[
			"excerpt on a post",
			{ files: pair("posts/x", [...POST, "excerpt: нельзя"], POST) },
			/"excerpt" is not used for post/,
		],
	];

	it.each(errors)("error: %s", (_name, fixture, pattern) => {
		expect(tree(fixture).errors.some((line) => pattern.test(line))).toBe(true);
	});

	const warnings: Array<[string, Fixture, RegExp]> = [
		[
			"draft in production",
			{
				files: pair("posts/x", POST, POST),
				json: { "posts.json": { x: { date: "2026-09-30", draft: true } } },
			},
			/"draft: true" — снять перед публикацией/,
		],
		[
			"marker in a post",
			{ files: pair("posts/x", POST, POST, "Б\n\n<!--more-->") },
			/"<!--more-->" is not used in posts/,
		],
		[
			"unexpected file",
			{ files: { ...pair("posts/x", POST, POST), "posts/x/notes.md": "x" } },
			/unexpected file "notes\.md"/,
		],
	];

	it.each(warnings)("warning: %s", (_name, fixture, pattern) => {
		expect(tree(fixture).warnings.some((line) => pattern.test(line))).toBe(
			true,
		);
	});
});
