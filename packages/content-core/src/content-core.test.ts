// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import * as fs from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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

// NOTE: `needs_translation` is `auto` and hidden from the form, but
// frontmatter.json must still declare it.
const scopeNames = (type: string, scope: FieldScope): string[] =>
	fieldsWithScope(type, scope)
		.map((field) => field.name)
		.sort();

describe("schema is split by storage", () => {
	const cms = readCms();
	const schema = readContentSchema();
	const ALL = Object.keys(ALL_FIELDS);

	it.each(ALL)("%s: translatable matches frontmatter.json", (type) => {
		const declared = cms.find((item) => item.name === type);
		expect(declared, `${type}: missing from frontmatter.json`).toBeDefined();

		expect(scopeNames(type, "translatable")).toEqual(
			(declared?.fields ?? []).map((field) => field.name).sort(),
		);
	});

	it.each(ALL)("%s: shared and local match content.schema.json", (type) => {
		const declared = schema.types[type];
		expect(declared, `${type}: missing from content.schema.json`).toBeDefined();

		expect(scopeNames(type, "shared")).toEqual(
			(declared?.shared ?? []).map((field) => field.name).sort(),
		);
		expect(scopeNames(type, "local")).toEqual(
			(declared?.local ?? []).map((field) => field.name).sort(),
		);
	});

	it.each(ALL)("%s: a field is declared by exactly one scope", (type) => {
		const declared = new Set(
			(scopeNames(type, "translatable") as string[]).concat(
				scopeNames(type, "shared"),
				scopeNames(type, "local"),
			),
		);
		const actual = ALL_FIELDS[type].map((field) => field.name);

		expect([...declared].sort()).toEqual([...new Set(actual)].sort());
	});

	it.each(ALL)("%s: no shared field leaked into frontmatter.json", (type) => {
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

	it("weekly stays in the schema but is not edited by hand", () => {
		expect(cms.map((item) => item.name)).toContain("weekly");
		expect(schema.types).toHaveProperty("weekly");
		expect(FIELDS).not.toHaveProperty("weekly");
	});

	it("a type outside CONTENT_TYPES does not break fieldsForType", () => {
		expect(fieldsForType("weekly")).toHaveLength(ALL_FIELDS.weekly.length);
		expect(fieldsForType("nope")).toEqual([]);
	});

	it.each(CONTENT_TYPES)(
		"defaultsFor emits no fields outside the schema: %s",
		(type) => {
			const allowed = new Set(fieldNames(type));
			for (const key of Object.keys(defaultsFor(type))) {
				expect(allowed.has(key), `${type}: ${key}`).toBe(true);
			}
		},
	);

	it("project has no date, so defaults have none either", () => {
		expect(fieldNames("project")).not.toContain("date");
		expect(defaultsFor("project")).not.toHaveProperty("date");
	});

	it("post and article default to today's date", () => {
		for (const type of ["post", "article"] as const) {
			expect(defaultsFor(type).date).toBe(
				new Date().toISOString().slice(0, 10),
			);
		}
	});

	it("path is the only local field, and only on project", () => {
		const wrong: string[] = [];

		for (const type of ALL) {
			const local = scopeNames(type, "local");
			const expected = type === "project" ? ["path"] : [];
			if (local.join(",") !== expected.join(",")) {
				wrong.push(`${type}: ${local.join(",") || "empty"}`);
			}
		}

		expect(wrong).toEqual([]);
	});
});

describe("field shape by scope", () => {
	it("fieldsByScope returns only fields of its storage", () => {
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

	it("fieldsByScope omits fields set by code", () => {
		expect(fieldsByScope("post", "translatable").map((f) => f.name)).toEqual([
			"title",
		]);
	});

	it("editableFields is FIELDS minus auto", () => {
		const expected = FIELDS.post.filter((f) => !f.auto).map((f) => f.name);
		expect(editableFields("post").map((f) => f.name)).toEqual(expected);
	});

	it("every visible field lands in exactly one scope", () => {
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

describe("whether quotes are needed", () => {
	it.each([
		["plain text", false],
		["text: with colon", true],
		["- starts with a dash", true],
		["true", true],
		["42", true],
		["", true],
		[" leading space", true],
		["line\nbreak", true],
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
			"a normal unit",
			{ title: "Мой пост", date: "2026-09-30", tags: ["svelte", "css"] },
			"Текст поста.",
			{ title: "Мой пост", date: "2026-09-30", tags: ["svelte", "css"] },
		],
		[
			"empty values are dropped",
			{ title: "T", draft: true, tags: [], image: undefined },
			"Тело.",
			{ title: "T", draft: true },
		],
		[
			"values YAML would not read as strings",
			{ title: "true", subtitle: "42", description: "да" },
			"Тело.",
			{ title: "true", subtitle: "42", description: "да" },
		],
		[
			"a multiline description",
			{ title: "T", description: "первая строка\nвторая строка" },
			"Тело.",
			{ title: "T", description: "первая строка\nвторая строка" },
		],
		["a wrapped body", { title: "T" }, "\n\nBody.\n\n", { title: "T" }],
	];

	it.each(cases)("%s", (_name, frontmatter, body, expected) => {
		const parsed = parseUnit(serializeUnit(frontmatter, body));
		expect(parsed.frontmatter).toEqual(expected);
		expect(parsed.body).toBe(body.replace(/^\n+/, "").replace(/\s+$/, ""));
	});

	it("field order is kept and numeric strings are quoted", () => {
		expect(serializeUnit({ b: "1", a: "2", c: 3 }, "Тело.")).toBe(
			'---\nb: "1"\na: "2"\nc: 3\n---\nТело.\n',
		);
	});

	it("a file without frontmatter reads as empty metadata", () => {
		const parsed = parseUnit("просто текст\n");
		expect(parsed.frontmatter).toEqual({});
		expect(parsed.body).toBe("просто текст");
	});
});

describe("the written file is stable under prettier", () => {
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

	it("after formatting the body reads back unwrapped", async () => {
		const parsed = parseUnit(
			await formatUnit(serializeUnit(frontmatter, "Тело.")),
		);
		expect(parsed.body).toBe("Тело.");
		expect(parsed.frontmatter).toEqual(frontmatter);
	});

	it("the format matches what prettier expects", async () => {
		const raw = await formatUnit(serializeUnit({ title: "T" }, "Тело."));
		expect(raw).toBe("---\ntitle: T\n---\n\nТело.\n");
	});
});

describe("slug", () => {
	it.each([
		["my-slug", true],
		["example-repo", true],
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

	it("the pattern matches the validator", () => {
		expect(new RegExp(`^${SLUG_PATTERN}$`).test("my-slug")).toBe(true);
		expect(new RegExp(`^${SLUG_PATTERN}$`).test("../x")).toBe(false);
	});

	it("reading outside the directory throws", () => {
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

		it("minutes with a leading zero are kept", () => {
			expect(draftSlug("post", new Date(2026, 0, 2, 9, 7))).toBe(
				"post-20260102-0907",
			);
		});

		it("the result is always a valid slug", () => {
			for (const type of ["post", "article", "project"]) {
				expect(isValidSlug(draftSlug(type, when))).toBe(true);
			}
		});

		it("two clicks in one minute give different slugs", () => {
			expect(draftSlug("post", when)).not.toBe(draftSlug("article", when));
		});
	});
});
