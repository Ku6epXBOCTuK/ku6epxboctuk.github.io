// @vitest-environment node

import * as fs from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { validateContent } from "./validate.ts";
import { repoRoot } from "./paths.ts";

/*
 * Валидация проверяет раскладку, поэтому фикстура повторяет её целиком: обе
 * схемы, папки типов и файлы `<type>s.json`. Иначе проверка «общее поле в
 * frontmatter» работала бы на схеме, которой нет на диске.
 */

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

describe("валидация", () => {
	afterAll(dropRoots);

	it("чистое дерево не даёт замечаний", () => {
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
				"posts.json": { ok: { date: "2026-09-30" } },
				"articles.json": { ok: { date: "2026-09-30" } },
				"projects.json": { ok: { repo: "https://github.com/o/n" } },
				"weekly.json": { "2026-09-22": { date: "2026-09-22" } },
			},
		});

		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
	});

	describe("папка без файлов", () => {
		it("папка без языковых md — предупреждение, а не ошибка", () => {
			// Папка, в которой нет ни одного `index.*.md`, — это мусор: в git
			// пустая папка не попадает и на сайт ничего не уносит. Но заметить её
			// надо: скорее всего единица не доехала при создании.
			//
			// Кладём не-md файл, потому что по-настоящему пустую папку через
			// фикстуру не создать, а по смыслу случай тот же.
			const result = tree({ files: { "posts/ghost/notes.txt": "мусор" } });

			expect(result.errors).toEqual([]);
			expect(
				result.warnings.some((line) => /ghost.*папка без/.test(line)),
			).toBe(true);
		});

		it("папка с чужим md — ошибка: языковых файлов нет", () => {
			const result = tree({ files: { "posts/ghost/README.md": "мусор" } });

			expect(
				result.errors.some((line) => /missing index\..*\.md/.test(line)),
			).toBe(true);
		});

		it("запись в json без папки — ошибка", () => {
			// Обратная сторона: если запись видна в json, пустая папка её не
			// оправдывает, иначе на сайте будет карточка без текста.
			const result = tree({
				json: { "posts.json": { ghost: { date: "2026-09-30" } } },
			});

			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe("запрет разъезда", () => {
		it("общее поле в frontmatter называет правильный файл", () => {
			const result = tree({
				files: pair("posts/x", ["title: T", "date: 2026-09-30"], POST),
			});

			const found = result.errors.find((line) => /"date"/.test(line));
			expect(found).toBeDefined();
			expect(found).toContain("not translatable");
			expect(found).toContain("posts.json");
		});

		it("локальное поле в frontmatter тоже запрещено", () => {
			const result = tree({
				files: pair(
					"projects/x",
					["title: T", "description: D", "path: ../brul"],
					["title: T", "description: D"],
				),
			});

			expect(
				result.errors.some((line) => /"path".*local\.json/.test(line)),
			).toBe(true);
		});

		it("переводимое поле в json — ошибка", () => {
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

		it("запись в json без папки — ошибка", () => {
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

		it("обязательное поле json проверяется", () => {
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

		it("тип поля в json проверяется", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				json: { "projects.json": { x: { repo: "r", order: "много" } } },
			});

			expect(
				result.errors.some((line) => /order.*must be a number/.test(line)),
			).toBe(true);
		});

		it("choice проверяется по списку", () => {
			const result = tree({
				files: pair("projects/x", PROJECT, PROJECT),
				json: { "projects.json": { x: { repo: "r", status: "nope" } } },
			});

			expect(
				result.errors.some((line) => /status.*must be one of/.test(line)),
			).toBe(true);
		});

		it("local json проверяется отдельно от общего", () => {
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
			"неверный тип поля",
			{ files: pair("posts/x", [...POST, "needs_translation: да"], POST) },
			/field "needs_translation" must be a boolean/,
		],
		[
			"не ISO дата в json",
			{
				files: pair("weekly/x", ["title: T"], ["title: T"]),
				json: { "weekly.json": { x: { date: "30.09.2026" } } },
			},
			/must be ISO YYYY-MM-DD/,
		],
		[
			"нет маркера в статье",
			{ files: pair("articles/x", ARTICLE, ARTICLE, "Текст.", "<!--more-->") },
			/article must contain/,
		],
		[
			"needs_translation в ru",
			{ files: pair("posts/x", [...POST, "needs_translation: true"], POST) },
			/only allowed in index\.en\.md/,
		],
		[
			"нет en",
			{ files: { "posts/x/index.ru.md": md(POST, "Б") } },
			/missing index\.en\.md/,
		],
		[
			"excerpt у поста",
			{ files: pair("posts/x", [...POST, "excerpt: нельзя"], POST) },
			/"excerpt" is not used for post/,
		],
		[
			"нет description у проекта",
			{ files: pair("projects/x", ["title: T"], ["title: T"]) },
			/missing required field "description"/,
		],
	];

	it.each(errors)("ошибка: %s", (_name, fixture, pattern) => {
		expect(tree(fixture).errors.some((line) => pattern.test(line))).toBe(true);
	});

	const warnings: Array<[string, Fixture, RegExp]> = [
		[
			"draft в продакшене",
			{
				files: pair("posts/x", POST, POST),
				json: { "posts.json": { x: { date: "2026-09-30", draft: true } } },
			},
			/"draft: true" — снять перед публикацией/,
		],
		[
			"маркер в посте",
			{ files: pair("posts/x", POST, POST, "Б\n\n<!--more-->") },
			/"<!--more-->" is not used in posts/,
		],
		[
			"лишний файл",
			{ files: { ...pair("posts/x", POST, POST), "posts/x/notes.md": "x" } },
			/unexpected file "notes\.md"/,
		],
	];

	it.each(warnings)("предупреждение: %s", (_name, fixture, pattern) => {
		expect(tree(fixture).warnings.some((line) => pattern.test(line))).toBe(
			true,
		);
	});
});
