// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
	ALL_FIELDS,
	FIELDS,
	defaultsFor,
	editableFields,
	fieldNames,
	fieldsByScope,
	fieldsForType,
	fieldsWithScope,
	type FieldScope,
} from "./fields.ts";
import { formatUnit, isFormatted } from "./format.ts";
import { draftSlug } from "./slug.ts";
import { CONTENT_TYPES } from "./types.ts";
import { type Report, validateContent } from "./validate.ts";
import { needsQuotes, parseUnit, serializeUnit } from "./yaml.ts";
import { repoRoot } from "./paths.ts";
import { deleteEntry, loadEntry } from "./entries.ts";
import { SLUG_PATTERN, isValidSlug } from "./slug.ts";

interface CmsField {
	name: string;
}

interface CmsType {
	name: string;
	fields: CmsField[];
}

interface ContentSchema {
	types: Record<string, { shared?: CmsField[]; local?: CmsField[] }>;
}

const readCms = (): CmsType[] => {
	const config = JSON.parse(
		fs.readFileSync(join(repoRoot(), "frontmatter.json"), "utf8"),
	) as Record<string, CmsType[]>;
	return config["frontMatter.taxonomy.contentTypes"] ?? [];
};

const readContentSchema = (): ContentSchema =>
	JSON.parse(
		fs.readFileSync(join(repoRoot(), "content.schema.json"), "utf8"),
	) as ContentSchema;

// Раскладка для сверки со схемой: `needs_translation` помечен `auto` и в форме
// его нет, но в frontmatter.json он обязан быть.
const scopeNames = (type: string, scope: FieldScope): string[] =>
	fieldsWithScope(type, scope)
		.map((field) => field.name)
		.sort();

describe("схема разделена по месту хранения", () => {
	const cms = readCms();
	const schema = readContentSchema();
	const ALL = Object.keys(ALL_FIELDS);

	it.each(ALL)("%s: translatable совпадает с frontmatter.json", (type) => {
		const declared = cms.find((item) => item.name === type);
		expect(declared, `${type}: нет в frontmatter.json`).toBeDefined();

		expect(scopeNames(type, "translatable")).toEqual(
			(declared?.fields ?? []).map((field) => field.name).sort(),
		);
	});

	it.each(ALL)("%s: shared и local совпадают с content.schema.json", (type) => {
		const declared = schema.types[type];
		expect(declared, `${type}: нет в content.schema.json`).toBeDefined();

		expect(scopeNames(type, "shared")).toEqual(
			(declared?.shared ?? []).map((field) => field.name).sort(),
		);
		expect(scopeNames(type, "local")).toEqual(
			(declared?.local ?? []).map((field) => field.name).sort(),
		);
	});

	it.each(ALL)("%s: поле объявлено ровно одним scope", (type) => {
		const declared = new Set(
			(scopeNames(type, "translatable") as string[]).concat(
				scopeNames(type, "shared"),
				scopeNames(type, "local"),
			),
		);
		const actual = ALL_FIELDS[type].map((field) => field.name);

		expect([...declared].sort()).toEqual([...new Set(actual)].sort());
	});

	it.each(ALL)("%s: shared-поле не попало в frontmatter.json", (type) => {
		const declared = new Set(
			(cms.find((item) => item.name === type)?.fields ?? []).map(
				(field) => field.name,
			),
		);

		for (const name of scopeNames(type, "shared")) {
			expect(declared.has(name), `${type}.${name}`).toBe(false);
		}
		for (const name of scopeNames(type, "local")) {
			expect(declared.has(name), `${type}.${name}`).toBe(false);
		}
	});

	it("weekly остаётся в схеме, но не редактируется руками", () => {
		expect(cms.map((item) => item.name)).toContain("weekly");
		expect(schema.types).toHaveProperty("weekly");
		expect(FIELDS).not.toHaveProperty("weekly");
	});

	it("выход за CONTENT_TYPES не ломает fieldsForType", () => {
		expect(fieldsForType("weekly")).toHaveLength(ALL_FIELDS.weekly.length);
		expect(fieldsForType("nope")).toEqual([]);
	});

	it.each(CONTENT_TYPES)(
		"defaultsFor не выдаёт полей вне схемы: %s",
		(type) => {
			const allowed = new Set(fieldNames(type));
			for (const key of Object.keys(defaultsFor(type))) {
				expect(allowed.has(key), `${type}: ${key}`).toBe(true);
			}
		},
	);

	it("у project нет date, поэтому и в дефолтах его нет", () => {
		expect(fieldNames("project")).not.toContain("date");
		expect(defaultsFor("project")).not.toHaveProperty("date");
	});

	it("у post и article дефолтная дата — сегодня", () => {
		for (const type of ["post", "article"] as const) {
			expect(defaultsFor(type).date).toBe(
				new Date().toISOString().slice(0, 10),
			);
		}
	});

	it("path — единственное local-поле, и только у project", () => {
		const wrong: string[] = [];

		for (const type of ALL) {
			const local = scopeNames(type, "local");
			const expected = type === "project" ? ["path"] : [];
			if (local.join(",") !== expected.join(",")) {
				wrong.push(`${type}: ${local.join(",") || "пусто"}`);
			}
		}

		expect(wrong).toEqual([]);
	});
});

describe("скелет поля по scope", () => {
	it("fieldsByScope отдаёт только поля своего места хранения", () => {
		expect(scopeNames("post", "translatable")).toEqual([
			"needs_translation",
			"title",
		]);
		expect(scopeNames("post", "shared")).toEqual([
			"date",
			"draft",
			"image",
			"link",
			"tags",
		]);
	});

	it("fieldsByScope не отдаёт поля, ставящиеся кодом", () => {
		expect(fieldsByScope("post", "translatable").map((f) => f.name)).toEqual([
			"title",
		]);
	});

	it("editableFields — это FIELDS минус auto", () => {
		const expected = FIELDS.post.filter((f) => !f.auto).map((f) => f.name);
		expect(editableFields("post").map((f) => f.name)).toEqual(expected);
	});

	it("каждое видимое поле попадает ровно в один scope", () => {
		for (const type of Object.keys(ALL_FIELDS)) {
			const counts = new Map<string, number>();
			for (const scope of ["translatable", "shared", "local"] as const) {
				for (const field of fieldsWithScope(type, scope)) {
					counts.set(field.name, (counts.get(field.name) ?? 0) + 1);
				}
			}

			for (const field of fieldsForType(type)) {
				expect(counts.get(field.name), `${type}.${field.name}`).toBe(1);
			}
		}
	});
});

describe("нужны ли кавычки", () => {
	it.each([
		["обычный текст", false],
		["текст: с двоеточием", true],
		["- начинается с дефиса", true],
		["true", true],
		["42", true],
		["", true],
		["пробел в начале ", true],
		["перенос\nстроки", true],
		["#hash", true],
	])("%s", (value, expected) => {
		expect(needsQuotes(value)).toBe(expected);
	});
});

describe("round-trip frontmatter", () => {
	const cases: Array<
		[string, Record<string, unknown>, string, Record<string, unknown>]
	> = [
		[
			"обычная единица",
			{ title: "Мой пост", date: "2026-09-30", tags: ["svelte", "css"] },
			"Текст поста.",
			{ title: "Мой пост", date: "2026-09-30", tags: ["svelte", "css"] },
		],
		[
			"пустые значения отбрасываются",
			{ title: "T", draft: true, tags: [], image: undefined },
			"Тело.",
			{ title: "T", draft: true },
		],
		[
			"значения, которые YAML прочитал бы не как строку",
			{ title: "true", subtitle: "42", description: "да" },
			"Тело.",
			{ title: "true", subtitle: "42", description: "да" },
		],
		[
			"многострочное описание",
			{ title: "T", description: "первая строка\nвторая строка" },
			"Тело.",
			{ title: "T", description: "первая строка\nвторая строка" },
		],
		["тело в обрамлении", { title: "T" }, "\n\nТело.\n\n", { title: "T" }],
	];

	it.each(cases)("%s", (_name, frontmatter, body, expected) => {
		const parsed = parseUnit(serializeUnit(frontmatter, body));
		expect(parsed.frontmatter).toEqual(expected);
		expect(parsed.body).toBe(body.replace(/^\n+/, "").replace(/\s+$/, ""));
	});

	it("порядок полей сохраняется, числа-как-строки кавычатся", () => {
		expect(serializeUnit({ b: "1", a: "2", c: 3 }, "Тело.")).toBe(
			'---\nb: "1"\na: "2"\nc: 3\n---\nТело.\n',
		);
	});

	it("файл без frontmatter читается как пустые метаданные", () => {
		const parsed = parseUnit("просто текст\n");
		expect(parsed.frontmatter).toEqual({});
		expect(parsed.body).toBe("просто текст");
	});
});

describe("файл после записи устойчив к prettier", () => {
	const frontmatter = {
		title: "Заголовок",
		date: "2026-09-30",
		tags: ["a", "b"],
	};

	const bodies = [
		"Короткое тело.",
		"Очень длинный абзац текста, который точно превышает восемьдесят символов ширины печати и должен быть перенесён prettier при сохранении.",
		"Первый абзац подлиннее, он тоже должен быть перенесён по ширине, иначе файл не пройдёт проверку.\n\nВторой абзац.",
		"Тело с `кодом` и списком:\n\n- пункт один\n- пункт два",
		"## Заголовок\n\nАбзац под ним.",
	];

	it.each(bodies)("%s", async (body) => {
		const once = await formatUnit(serializeUnit(frontmatter, body));
		const twice = await formatUnit(once);

		expect(twice).toBe(once);
		expect(await isFormatted(once)).toBe(true);
	});

	it("после форматирования тело читается обратно без обрамления", async () => {
		const parsed = parseUnit(
			await formatUnit(serializeUnit(frontmatter, "Тело.")),
		);
		expect(parsed.body).toBe("Тело.");
		expect(parsed.frontmatter).toEqual(frontmatter);
	});

	it("формат соответствует тому, что ожидает prettier", async () => {
		const raw = await formatUnit(serializeUnit({ title: "T" }, "Тело."));
		expect(raw).toBe("---\ntitle: T\n---\n\nТело.\n");
	});
});

describe("slug", () => {
	it.each([
		["my-slug", true],
		["brul", true],
		["2026-09-29", true],
		["My-Slug", false],
		["my_slug", false],
		["../escape", false],
		["a/../../b", false],
		["", false],
		["-lead", false],
		["trail-", false],
	])("%s", (slug, expected) => {
		expect(isValidSlug(slug)).toBe(expected);
	});

	it("паттерн совпадает с проверкой", () => {
		expect(new RegExp(`^${SLUG_PATTERN}$`).test("my-slug")).toBe(true);
		expect(new RegExp(`^${SLUG_PATTERN}$`).test("../x")).toBe(false);
	});

	it("чтение за пределами каталога бросает ошибку", () => {
		expect(() => loadEntry("post", "../../etc")).toThrow(/Некорректный slug/);
		expect(() => deleteEntry("post", "../escape")).toThrow(/Некорректный slug/);
	});

	describe("draftSlug", () => {
		const when = new Date(2026, 8, 30, 14, 5);

		it.each([
			["post", "post-20260930-1405"],
			["article", "article-20260930-1405"],
			["project", "project-20260930-1405"],
		])("%s → %s", (type, expected) => {
			expect(draftSlug(type, when)).toBe(expected);
		});

		it("минуты с ведущим нулём не теряются", () => {
			expect(draftSlug("post", new Date(2026, 0, 2, 9, 7))).toBe(
				"post-20260102-0907",
			);
		});

		it("на выходе всегда валидный slug", () => {
			for (const type of ["post", "article", "project"]) {
				expect(isValidSlug(draftSlug(type, when))).toBe(true);
			}
		});

		it("два клика в одну минуту дают разные slug", () => {
			expect(draftSlug("post", when)).not.toBe(draftSlug("article", when));
		});
	});
});

describe("валидация", () => {
	const REPO = "https://github.com/Ku6epXBOCTuK/brul";
	const ARTICLE = ["title: Статья"];
	const POST = ["title: Пост"];
	const PROJECT = ["title: Проект", "description: Описание"];

	// Фронтматтер с `date` раньше был валиден. Теперь `date` общее поле и в md
	// ему не место — это ровно та проверка, что модель не поехала назад.
	const POST_SHARED_IN_MD = ["title: Пост", "date: 2026-09-30"];

	const roots: string[] = [];

	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	});

	function md(lines: string[], body: string): string {
		return `---\n${lines.join("\n")}\n---\n\n${body}\n`;
	}

	function tree(files: Record<string, string>): Report {
		const root = fs.mkdtempSync(join(tmpdir(), "content-core-"));
		roots.push(root);
		fs.copyFileSync(
			join(repoRoot(), "frontmatter.json"),
			join(root, "frontmatter.json"),
		);
		for (const [rel, text] of Object.entries(files)) {
			const file = join(root, "src", "content", rel);
			fs.mkdirSync(join(file, ".."), { recursive: true });
			fs.writeFileSync(file, text, "utf8");
		}
		return validateContent(root);
	}

	function pair(
		dir: string,
		ru: string[],
		en: string[],
		ruBody = "Б",
		enBody = "B",
	) {
		return {
			[`${dir}/index.ru.md`]: md(ru, ruBody),
			[`${dir}/index.en.md`]: md(en, enBody),
		};
	}

	it("чистое дерево не даёт замечаний", () => {
		const report = tree({
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
		});
		expect(report.errors).toEqual([]);
		expect(report.warnings).toEqual([]);
	});

	it("общее поле в frontmatter — ошибка", () => {
		const report = tree({
			...pair("posts/date-in-md", POST_SHARED_IN_MD, POST_SHARED_IN_MD),
		});
		expect(
			report.errors.some((line) => /unknown field "date"/.test(line)),
		).toBe(true);
	});

	const errors: Array<[string, Record<string, string>, RegExp]> = [
		[
			"unknown field",
			pair("posts/x", [...POST, "nope: 1"], POST),
			/unknown field "nope"/,
		],
		[
			"missing required",
			pair("posts/x", ["date: 2026-09-30"], POST),
			/missing required field "title"/,
		],
		[
			"неверный тип поля",
			pair("posts/x", [...POST, "needs_translation: да"], POST),
			/field "needs_translation" must be a boolean/,
		],
		[
			// Типы shared-полей проверяются на json, а не на md. Фаза 4.
			"тег не строка",
			pair("posts/x", [...POST, "tags: нет"], POST),
			/unknown field "tags"/,
		],
		[
			"не ISO дата",
			pair("weekly/x", ["title: T", "date: 30.09.2026"], ["title: T"]),
			/must be ISO YYYY-MM-DD/,
		],
		[
			"нет маркера в статье",
			pair("articles/x", ARTICLE, ARTICLE, "Текст.", "<!--more-->"),
			/article must contain/,
		],
		[
			"needs_translation в ru",
			pair("posts/x", [...POST, "needs_translation: true"], POST),
			/only allowed in index\.en\.md/,
		],
		[
			"нет en",
			{ "posts/x/index.ru.md": md(POST, "Б") },
			/missing index\.en\.md/,
		],
		[
			"draft разошёлся",
			pair("weekly/x", ["title: T", "draft: true"], ["title: T"]),
			/draft must match between/,
		],
		[
			"excerpt у поста",
			pair("posts/x", [...POST, "excerpt: нельзя"], POST),
			/"excerpt" is not used for post/,
		],
		[
			"isMock без draft",
			pair(
				"projects/x",
				[...PROJECT, "isMock: true"],
				[...PROJECT, "isMock: true"],
			),
			/"isMock: true" требует "draft: true"/,
		],
		[
			"старое поле type",
			pair("projects/x", [...PROJECT, "type: x"], PROJECT),
			/"type" is removed for projects/,
		],
		[
			"старое поле url",
			pair("projects/x", [...PROJECT, "url: https://e.com"], PROJECT),
			/"url" is renamed to "repo"/,
		],
		[
			"нет description у проекта",
			pair(
				"projects/x",
				["title: T", `repo: ${REPO}`],
				["title: T", `repo: ${REPO}`],
			),
			/missing required field "description"/,
		],
	];

	it.each(errors)("ошибка: %s", (_name, files, pattern) => {
		expect(tree(files).errors.some((line) => pattern.test(line))).toBe(true);
	});

	const warnings: Array<[string, Record<string, string>, RegExp]> = [
		[
			"draft в продакшене",
			pair("posts/x", [...POST, "draft: true"], [...POST, "draft: true"]),
			/"draft: true" — снять перед публикацией/,
		],
		[
			"маркер в посте",
			pair("posts/x", POST, POST, "Б\n\n<!--more-->"),
			/"<!--more-->" is not used in posts/,
		],
		[
			"лишний файл",
			{ ...pair("posts/x", POST, POST), "posts/x/notes.md": "x" },
			/unexpected file "notes\.md"/,
		],
	];

	it.each(warnings)("предупреждение: %s", (_name, files, pattern) => {
		expect(tree(files).warnings.some((line) => pattern.test(line))).toBe(true);
	});

	it("пустая папка в дереве", () => {
		const root = fs.mkdtempSync(join(tmpdir(), "content-core-"));
		roots.push(root);
		fs.copyFileSync(
			join(repoRoot(), "frontmatter.json"),
			join(root, "frontmatter.json"),
		);
		fs.mkdirSync(join(root, "src", "content", "posts", "empty"), {
			recursive: true,
		});
		expect(validateContent(root).errors.join()).toMatch(
			/\[posts\] empty: no index\.\*\.md file found/,
		);
	});

	it("в путях сообщений есть slug", () => {
		const report = tree(pair("posts/x", [...POST, "nope: 1"], POST));
		for (const line of [...report.errors, ...report.warnings]) {
			expect(line).toMatch(
				/^(\[\w+\] \S+|src[\\/]content[\\/]\w+[\\/]\S+[\\/]index\.(ru|en)\.md)/,
			);
		}
	});
});
