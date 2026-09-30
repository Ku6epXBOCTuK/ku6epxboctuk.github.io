// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { FIELDS, fieldNames } from "./fields.ts";
import { formatUnit, isFormatted } from "./format.ts";
import {
	SLUG_PATTERN,
	createUnit,
	deleteUnit,
	isValidSlug,
	readUnit,
	renameUnit,
	writeUnit,
} from "./repository.ts";
import { CONTENT_TYPES, type ContentType } from "./types.ts";
import { type Report, validateContent } from "./validate.ts";
import { needsQuotes, parseUnit, serializeUnit } from "./yaml.ts";
import { repoRoot, unitFile } from "./paths.ts";

interface CmsField {
	name: string;
}

interface CmsType {
	name: string;
	fields: CmsField[];
}

describe("схема совпадает с frontmatter.json", () => {
	const config = JSON.parse(
		fs.readFileSync(join(repoRoot(), "frontmatter.json"), "utf8"),
	) as Record<string, CmsType[]>;

	const types = config["frontMatter.taxonomy.contentTypes"] ?? [];

	it.each(CONTENT_TYPES)("%s: набор полей идентичен", (type) => {
		const cms = types.find((item) => item.name === type);
		expect(cms, `${type} есть в frontmatter.json`).toBeDefined();

		expect([...fieldNames(type)].sort()).toEqual(
			(cms?.fields ?? []).map((field) => field.name).sort(),
		);
	});

	it("weekly остаётся в схеме, но не редактируется руками", () => {
		expect(types.map((item) => item.name)).toContain("weekly");
		expect(CONTENT_TYPES).not.toContain("weekly");
	});

	it("isMock скрыт из формы, но присутствует в схеме", () => {
		for (const type of CONTENT_TYPES) {
			expect(fieldNames(type)).toContain("isMock");
			expect(FIELDS[type].find((f) => f.name === "isMock")?.hidden, type).toBe(
				true,
			);
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
		expect(() => readUnit("post", "../../etc", "ru")).toThrow(
			/Некорректный slug/,
		);
	});
});

describe("запись на диск", () => {
	const type: ContentType = "post";
	const slug = "vitest-fixture";
	const content = {
		frontmatter: { title: "Фикстура", date: "2026-09-30", tags: ["test"] },
		body: "Тело фикстуры.",
	};

	it("создаёт, читает, переименовывает и удаляет", async () => {
		const file = await createUnit(type, slug, "ru", content);
		expect(fs.existsSync(file)).toBe(true);
		expect(await isFormatted(fs.readFileSync(file, "utf8"))).toBe(true);

		const read = readUnit(type, slug, "ru");
		expect(read?.frontmatter).toEqual(content.frontmatter);
		expect(read?.body).toBe(content.body);

		const next = `${slug}-renamed`;
		expect(renameUnit(type, slug, next)).toBe(true);
		expect(readUnit(type, slug, "ru")).toBeUndefined();
		expect(readUnit(type, next, "ru")?.body).toBe(content.body);

		expect(deleteUnit(type, next)).toBe(true);
		expect(fs.existsSync(unitFile(type, next, "ru"))).toBe(false);
	});

	it("не перезаписывает чужую единицу молча", async () => {
		const other = `${slug}-other`;
		await createUnit(type, other, "ru", content);
		try {
			await expect(createUnit(type, other, "ru", content)).rejects.toThrow(
				/уже существует/,
			);
		} finally {
			deleteUnit(type, other);
		}
	});

	it("перезапись через writeUnit разрешена", async () => {
		const over = `${slug}-over`;
		await createUnit(type, over, "ru", content);
		try {
			await writeUnit(type, over, "ru", { ...content, body: "Другое тело." });
			expect(readUnit(type, over, "ru")?.body).toBe("Другое тело.");
		} finally {
			deleteUnit(type, over);
		}
	});
});

describe("валидация", () => {
	const REPO = "https://github.com/Ku6epXBOCTuK/brul";
	const ARTICLE = ["title: Статья", "date: 2026-09-30"];
	const POST = ["title: Пост", "date: 2026-09-30"];
	const PROJECT = ["title: Проект", "description: Описание", `repo: ${REPO}`];

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
				["title: Неделя", "date: 2026-09-22", "excerpt: Итог"],
				["title: Week", "date: 2026-09-22", "excerpt: Summary"],
			),
		});
		expect(report.errors).toEqual([]);
		expect(report.warnings).toEqual([]);
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
			pair("posts/x", [...POST, "draft: да"], POST),
			/field "draft" must be a boolean/,
		],
		[
			"tags не массив",
			pair("posts/x", [...POST, "tags: нет"], POST),
			/field "tags" must be an array/,
		],
		[
			"не ISO дата",
			pair("posts/x", ["title: T", "date: 30.09.2026"], POST),
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
			pair("posts/x", [...POST, "draft: true"], POST),
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
