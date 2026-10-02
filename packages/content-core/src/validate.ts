import * as fs from "node:fs";
import { join, resolve } from "node:path";
import { repoRoot } from "./paths.ts";
import type { ContentType, Frontmatter } from "./types.ts";
import { parseUnit } from "./yaml.ts";

interface FmField {
	name: string;
	type: string;
	required?: boolean;
}

interface SchemaType {
	name: string;
	fields: FmField[];
}

interface Target {
	dir: string;
	schema: string;
}

const TARGETS: Target[] = [
	{ dir: "articles", schema: "article" },
	{ dir: "posts", schema: "post" },
	{ dir: "projects", schema: "project" },
	{ dir: "weekly", schema: "weekly" },
];

const FOLDER: Record<ContentType, string> = {
	post: "posts",
	article: "articles",
	project: "projects",
};

const TEASER_FROM_BODY = new Set(["articles", "posts"]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LANG_FILE = /^index\.(ru|en)\.md$/;

export interface Report {
	errors: string[];
	warnings: string[];
}

function checkFieldType(value: unknown, expected: string): string | null {
	if (value == null) return null;

	switch (expected) {
		case "string":
		case "datetime":
		case "image":
			if (typeof value !== "string") {
				return `must be a string, got ${Array.isArray(value) ? "array" : typeof value}`;
			}
			break;
		case "boolean":
			if (typeof value !== "boolean") {
				return `must be a boolean, got ${typeof value}`;
			}
			break;
	}

	return null;
}

function lintFile(
	type: string,
	schema: SchemaType | undefined,
	report: Report,
	displayUnit: string,
	unitAbs: string,
	file: string,
	lang: "ru" | "en",
): void {
	const display = join(displayUnit, file);
	const { frontmatter, body } = parseUnit(
		fs.readFileSync(join(unitAbs, file), "utf8"),
	);
	const data = frontmatter;

	if (schema) {
		const allowed = new Set(schema.fields.map((f) => f.name));

		for (const key of Object.keys(data)) {
			if (!allowed.has(key)) {
				report.errors.push(
					`${display}: unknown field "${key}" (not in schema)`,
				);
			}
		}

		for (const field of schema.fields) {
			const val = data[field.name];

			if (field.required && (val == null || val === "")) {
				report.errors.push(
					`${display}: missing required field "${field.name}"`,
				);
				continue;
			}

			if (val != null) {
				const err = checkFieldType(val, field.type);
				if (err) {
					report.errors.push(`${display}: field "${field.name}" ${err}`);
				}
			}
		}
	}

	if (typeof data.date === "string" && !ISO_DATE.test(data.date)) {
		report.errors.push(
			`${display}: field "date" must be ISO YYYY-MM-DD, got "${data.date}"`,
		);
	}

	if (data.tags !== undefined) {
		if (!Array.isArray(data.tags)) {
			report.errors.push(`${display}: field "tags" must be an array`);
		} else {
			for (const tag of data.tags) {
				if (typeof tag !== "string") {
					report.errors.push(`${display}: field "tags" items must be strings`);
					break;
				}
			}
		}
	}

	if (type === "articles" && !body.includes("<!--more-->")) {
		report.errors.push(
			`${display}: article must contain "<!--more-->" marker in body`,
		);
	}

	if (type === "posts" && body.includes("<!--more-->")) {
		report.warnings.push(
			`${display}: "<!--more-->" is not used in posts (whole body goes to feed)`,
		);
	}

	if (type === "projects") {
		if ("type" in data) {
			report.errors.push(
				`${display}: field "type" is removed for projects (use tags)`,
			);
		}
		if ("url" in data) {
			report.errors.push(`${display}: field "url" is renamed to "repo"`);
		}
	}

	if (TEASER_FROM_BODY.has(type) && "excerpt" in data) {
		report.errors.push(
			`${display}: field "excerpt" is not used for ${type.replace(/s$/, "")} (teaser is taken from body)`,
		);
	}

	if (data.isMock === true && data.draft !== true) {
		report.errors.push(
			`${display}: "isMock: true" требует "draft: true" (mock-контент не должен попасть на прод)`,
		);
	}

	if (data.draft === true && data.isMock !== true) {
		report.warnings.push(`${display}: "draft: true" — снять перед публикацией`);
	}

	if (lang === "ru" && "needs_translation" in data && data.isMock !== true) {
		report.errors.push(
			`${display}: field "needs_translation" is only allowed in index.en.md`,
		);
	}
}

function draftOf(file: string): unknown {
	return parseUnit(fs.readFileSync(file, "utf8")).frontmatter.draft;
}

export function loadSchema(root = repoRoot()): Map<string, SchemaType> {
	const raw = fs.readFileSync(join(root, "frontmatter.json"), "utf8");
	const config = JSON.parse(raw) as Record<string, SchemaType[]>;
	const types = config["frontMatter.taxonomy.contentTypes"] ?? [];
	return new Map(types.map((type) => [type.name, type]));
}

function validateEntryIn(
	dir: string,
	schema: SchemaType | undefined,
	report: Report,
	displayUnit: string,
	unitAbs: string,
	unit: string,
): void {
	const files = fs.readdirSync(unitAbs).filter((file) => file.endsWith(".md"));

	if (files.length === 0) {
		report.errors.push(`[${dir}] ${unit}: no index.*.md file found`);
		return;
	}

	if (!files.includes("index.ru.md")) {
		report.errors.push(`[${dir}] ${unit}: missing index.ru.md`);
	}

	if (!files.includes("index.en.md")) {
		report.errors.push(`[${dir}] ${unit}: missing index.en.md`);
	}

	if (files.includes("index.ru.md") && files.includes("index.en.md")) {
		const ru = draftOf(join(unitAbs, "index.ru.md"));
		const en = draftOf(join(unitAbs, "index.en.md"));
		if (ru !== en) {
			report.errors.push(
				`[${dir}] ${unit}: draft must match between index.ru.md and index.en.md`,
			);
		}
	}

	for (const file of files) {
		const match = LANG_FILE.exec(file);
		if (!match) {
			report.warnings.push(
				`[${dir}] ${unit}: unexpected file "${file}" (expected index.ru.md / index.en.md)`,
			);
			continue;
		}
		lintFile(
			dir,
			schema,
			report,
			displayUnit,
			unitAbs,
			file,
			match[1] as "ru" | "en",
		);
	}
}

function targetFor(type: ContentType): Target {
	const found = TARGETS.find((item) => item.dir === FOLDER[type]);
	if (!found) throw new Error(`Нет правил валидации для типа ${type}`);
	return found;
}

export function validateContent(root = repoRoot()): Report {
	const report: Report = { errors: [], warnings: [] };
	const schemas = loadSchema(root);
	const displayBase = join("src", "content");

	for (const { dir, schema: schemaName } of TARGETS) {
		const displayDir = join(displayBase, dir);
		const absDir = resolve(root, displayBase, dir);

		if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
			continue;
		}

		const schema = schemas.get(schemaName);
		const units = fs
			.readdirSync(absDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);

		for (const unit of units) {
			validateEntryIn(
				dir,
				schema,
				report,
				join(displayDir, unit),
				join(absDir, unit),
				unit,
			);
		}
	}

	return report;
}

/**
 * Проверка одной единицы: редактор зовёт её после каждого сохранения, а не
 * гоняет всё дерево и не выковыривает свои строки из общего отчёта.
 */
export function validateEntry(
	type: ContentType,
	slug: string,
	root = repoRoot(),
): Report {
	const report: Report = { errors: [], warnings: [] };
	const { dir, schema: schemaName } = targetFor(type);
	const displayUnit = join("src", "content", dir, slug);
	const unitAbs = resolve(root, "src", "content", dir, slug);

	if (!fs.existsSync(unitAbs)) {
		report.errors.push(`[${dir}] ${slug}: no index.*.md file found`);
		return report;
	}

	validateEntryIn(
		dir,
		loadSchema(root).get(schemaName),
		report,
		displayUnit,
		unitAbs,
		slug,
	);
	return report;
}

export type { Frontmatter };
