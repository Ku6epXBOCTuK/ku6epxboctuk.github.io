import * as fs from "node:fs";
import { basename, join, resolve } from "node:path";
import { contentDir, metaFile, repoRoot } from "./paths.ts";
import { SCHEMA_TYPES, type SchemaType } from "./types.ts";
import { parseUnit } from "./yaml.ts";

/*
 * Валидация проверяет две схемы, потому что данные лежат в двух файлах.
 * `frontmatter.json` описывает переводимое (его читает фронтматтер в
 * редакторе), `content.schema.json` — общее и локальное.
 *
 * Отдельная проверка важна не ради удобства: если не запретить общие поля в
 * frontmatter явно, кто-нибудь рано или поздно туда вернёт `date`, и разъезд
 * двух файлов заметит только сравнение глазом.
 */

interface SchemaField {
	name: string;
	type: string;
	required?: boolean;
	choices?: string[];
	default?: unknown;
}

interface FmType {
	name: string;
	fields: SchemaField[];
}

interface ContentSchema {
	types: Record<string, { shared?: SchemaField[]; local?: SchemaField[] }>;
}

interface TypeRules {
	/** Переводимое: frontmatter `index.<lang>.md`. */
	translatable: SchemaField[];
	/** Общее: `<type>s.json`. */
	shared: SchemaField[];
	/** Локальное: `<type>s.local.json`, в гитигноре. */
	local: SchemaField[];
}

export interface Report {
	errors: string[];
	warnings: string[];
}

const TEASER_FROM_BODY = new Set(["posts", "articles"]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LANG_FILE = /^index\.(ru|en)\.md$/;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function targetOf(type: SchemaType): string {
	return type === "weekly" ? "weekly" : `${type}s`;
}

export function loadSchema(root = repoRoot()): Map<string, TypeRules> {
	const config = JSON.parse(
		fs.readFileSync(join(root, "frontmatter.json"), "utf8"),
	) as Record<string, FmType[]>;
	const content = JSON.parse(
		fs.readFileSync(join(root, "content.schema.json"), "utf8"),
	) as ContentSchema;

	const translatable = new Map(
		(config["frontMatter.taxonomy.contentTypes"] ?? []).map((type) => [
			type.name,
			type.fields,
		]),
	);

	return new Map(
		SCHEMA_TYPES.map((type) => [
			type,
			{
				translatable: translatable.get(type) ?? [],
				shared: content.types[type]?.shared ?? [],
				local: content.types[type]?.local ?? [],
			},
		]),
	);
}

function checkType(value: unknown, field: SchemaField): string | null {
	if (value == null) return null;

	switch (field.type) {
		case "string":
		case "datetime":
		case "icon":
		case "image":
		case "url":
			if (typeof value !== "string") {
				return `must be a string, got ${Array.isArray(value) ? "array" : typeof value}`;
			}
			break;
		case "boolean":
			if (typeof value !== "boolean") {
				return `must be a boolean, got ${typeof value}`;
			}
			break;
		case "number":
			if (typeof value !== "number") {
				return `must be a number, got ${typeof value}`;
			}
			break;
		case "tags":
		case "string[]":
			if (!Array.isArray(value)) {
				return `must be an array, got ${typeof value}`;
			}
			for (const item of value) {
				if (typeof item !== "string") {
					return "items must be strings";
				}
			}
			break;
		case "choice":
			if (typeof value !== "string") {
				return `must be a string, got ${typeof value}`;
			}
			if (field.choices && !field.choices.includes(value)) {
				return `must be one of ${field.choices.join(", ")}, got "${value}"`;
			}
			break;
	}

	if (
		field.name === "date" &&
		typeof value === "string" &&
		!ISO_DATE.test(value)
	) {
		return `must be ISO YYYY-MM-DD, got "${value}"`;
	}

	return null;
}

function checkRecord(
	display: string,
	data: Record<string, unknown>,
	rules: SchemaField[],
	report: Report,
	/** Ключи, о которых уже сказано иначе — чтобы не сообщать дважды. */
	skip: Set<string> = new Set(),
): void {
	const allowed = new Map(rules.map((field) => [field.name, field]));

	for (const key of Object.keys(data)) {
		if (skip.has(key)) continue;
		if (!allowed.has(key)) {
			report.errors.push(`${display}: unknown field "${key}" (not in schema)`);
		}
	}

	for (const field of rules) {
		const value = data[field.name];
		if (value == null || value === "") {
			if (field.required) {
				report.errors.push(
					`${display}: missing required field "${field.name}"`,
				);
			}
			continue;
		}
		const err = checkType(value, field);
		if (err) report.errors.push(`${display}: field "${field.name}" ${err}`);
	}
}

/**
 * Общие и локальные поля в языковом frontmatter — главный запрет новой модели.
 * Сообщение называет правильный файл: «unknown field» оставило бы вопрос, куда
 * девать значение.
 *
 * Возвращает множество ключей, о которых уже сказано, чтобы проверка типов не
 * продублировала то же самое общим словом про неизвестное поле.
 */
function reportForeignFields(
	display: string,
	frontmatter: Record<string, unknown>,
	rules: TypeRules,
	sharedFile: string,
	localFile: string,
	report: Report,
): Set<string> {
	const translatable = new Set(rules.translatable.map((f) => f.name));
	const shared = new Set(rules.shared.map((f) => f.name));
	const local = new Set(rules.local.map((f) => f.name));
	const reported = new Set<string>();

	for (const key of Object.keys(frontmatter)) {
		if (translatable.has(key)) continue;

		const target = shared.has(key)
			? sharedFile
			: local.has(key)
				? localFile
				: "";
		if (!target) continue;

		reported.add(key);
		report.errors.push(
			`${display}: field "${key}" is not translatable — belongs in ${target}, not in frontmatter`,
		);
	}

	return reported;
}

function lintMdFile(
	type: string,
	rules: TypeRules,
	report: Report,
	display: string,
	unitAbs: string,
	file: string,
	lang: "ru" | "en",
	sharedFile: string,
	localFile: string,
): void {
	const { frontmatter, body } = parseUnit(
		fs.readFileSync(join(unitAbs, file), "utf8"),
	);

	const reported = reportForeignFields(
		display,
		frontmatter,
		rules,
		sharedFile,
		localFile,
		report,
	);
	checkRecord(display, frontmatter, rules.translatable, report, reported);

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

	if (TEASER_FROM_BODY.has(type) && "excerpt" in frontmatter) {
		report.errors.push(
			`${display}: field "excerpt" is not used for ${type.replace(/s$/, "")} (teaser is taken from body)`,
		);
	}

	if (lang === "ru" && frontmatter.needs_translation === true) {
		report.errors.push(
			`${display}: field "needs_translation" is only allowed in index.en.md`,
		);
	}
}

function readJson(file: string): Record<string, unknown> | undefined {
	if (!fs.existsSync(file)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
	} catch (err) {
		return { __broken: String(err) };
	}
}

function checkJsonRecord(
	display: string,
	record: unknown,
	rules: SchemaField[],
	report: Report,
): void {
	if (!record || typeof record !== "object" || Array.isArray(record)) {
		report.errors.push(`${display}: record must be an object`);
		return;
	}
	checkRecord(display, record as Record<string, unknown>, rules, report);
}

function validateUnit(
	schemaType: SchemaType,
	rules: TypeRules,
	root: string,
	report: Report,
	unitAbs: string,
	displayUnit: string,
	unit: string,
): void {
	const type = targetOf(schemaType);
	// Имя файла берём из настоящего пути, а не собираем из имени папки: из
	// `posts` так получалось `postss.json`.
	const sharedName = basename(metaFile(schemaType, root));
	const localName = basename(
		metaFile(schemaType, root).replace(/\.json$/, ".local.json"),
	);

	const files = fs.existsSync(unitAbs)
		? fs.readdirSync(unitAbs).filter((file) => file.endsWith(".md"))
		: [];

	if (files.length === 0) {
		// Папка без языковых файлов — это мусор, а не сломанный контент: в git
		// пустая папка не попадает и на сайт ничего не уносит. Ошибкой это было бы,
		// если бы запись была видна где-то ещё: в json или в списке.
		report.warnings.push(
			`[${type}] ${unit}: папка без index.*.md — удалить или наполнить`,
		);
		return;
	}

	for (const lang of ["ru", "en"]) {
		if (!files.includes(`index.${lang}.md`)) {
			report.errors.push(`[${type}] ${unit}: missing index.${lang}.md`);
		}
	}

	for (const file of files) {
		const match = LANG_FILE.exec(file);
		if (!match) {
			report.warnings.push(
				`[${type}] ${unit}: unexpected file "${file}" (expected index.ru.md / index.en.md)`,
			);
			continue;
		}
		lintMdFile(
			type,
			rules,
			report,
			join(displayUnit, file),
			unitAbs,
			file,
			match[1] as "ru" | "en",
			sharedName,
			localName,
		);
	}

	// Общие поля лежат в json типа, а не в папке: запись без них не значит, что
	// полей нет, но запись о них без папки — мусор.
	const meta = readJson(metaFile(schemaType, root)) ?? {};
	const shared = meta[unit];
	if (shared && typeof shared === "object" && !Array.isArray(shared)) {
		checkJsonRecord(
			join(displayUnit, sharedName),
			shared,
			rules.shared,
			report,
		);
		if ((shared as Record<string, unknown>).draft === true) {
			report.warnings.push(
				`[${type}] ${unit}: "draft: true" — снять перед публикацией`,
			);
		}
	}

	const local = readJson(localFileFor(schemaType, root)) ?? {};
	if (unit in local) {
		checkJsonRecord(
			join(displayUnit, localName),
			local[unit],
			rules.local,
			report,
		);
	}
}

function localFileFor(type: SchemaType, root: string): string {
	return metaFile(type, root).replace(/\.json$/, ".local.json");
}

function checkFolderConsistency(
	type: string,
	schemaType: SchemaType,
	rules: TypeRules,
	root: string,
	report: Report,
	displayBase: string,
): void {
	const absDir = resolve(root, displayBase, targetOf(schemaType));
	const folders = fs.existsSync(absDir)
		? fs
				.readdirSync(absDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name)
		: [];

	const meta = readJson(metaFile(schemaType, root)) ?? {};
	const local = readJson(localFileFor(schemaType, root)) ?? {};
	const sharedName = basename(metaFile(schemaType, root));
	const localName = basename(localFileFor(schemaType, root));

	for (const slug of Object.keys(meta)) {
		if (folders.includes(slug)) continue;
		report.errors.push(
			`[${type}] ${slug}: есть запись в ${sharedName}, но нет папки`,
		);
	}

	for (const slug of Object.keys(local)) {
		if (folders.includes(slug)) continue;
		report.errors.push(
			`[${type}] ${slug}: есть запись в ${localName}, но нет папки`,
		);
	}

	// Ключ обязан совпадать с именем папки: иначе переименование папки оставит
	// общие поля под старым slug, и единица станет невидимой в списке.
	for (const slug of folders) {
		if (!SLUG_RE.test(slug)) {
			report.errors.push(`[${type}] ${slug}: недопустимое имя папки`);
		}
	}
	void rules;
}

export function validateContent(root = repoRoot()): Report {
	const report: Report = { errors: [], warnings: [] };
	const schemas = loadSchema(root);
	const displayBase = join("src", "content");

	for (const schemaType of SCHEMA_TYPES) {
		const type = targetOf(schemaType);
		const rules = schemas.get(schemaType);
		if (!rules) continue;

		checkFolderConsistency(type, schemaType, rules, root, report, displayBase);

		const absDir = contentDir(schemaType, root);
		if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) continue;

		for (const unit of fs.readdirSync(absDir, { withFileTypes: true })) {
			if (!unit.isDirectory()) continue;
			validateUnit(
				schemaType,
				rules,
				root,
				report,
				join(absDir, unit.name),
				join(displayBase, type, unit.name),
				unit.name,
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
	type: SchemaType,
	slug: string,
	root = repoRoot(),
): Report {
	const report: Report = { errors: [], warnings: [] };
	const schemas = loadSchema(root);
	const rules = schemas.get(type);
	if (!rules) return report;

	const folder = targetOf(type);
	validateUnit(
		type,
		rules,
		root,
		report,
		contentDir(type, root) + `/${slug}`,
		join("src", "content", folder, slug),
		slug,
	);

	return report;
}
