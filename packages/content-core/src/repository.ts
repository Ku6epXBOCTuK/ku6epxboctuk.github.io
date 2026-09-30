import * as fs from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { formatUnit } from "./format.ts";
import { contentDir, unitDir, unitFile } from "./paths.ts";
import {
	CONTENT_LANGS,
	CONTENT_TYPES,
	type ContentLang,
	type ContentType,
	type ContentUnit,
	type Frontmatter,
	type UnitSummary,
} from "./types.ts";
import { parseUnit, serializeUnit } from "./yaml.ts";

// slug подставляется в путь файловой системы, поэтому шаблон жёсткий.
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SLUG_PATTERN = "[a-z0-9]+(-[a-z0-9]+)*";

export function isValidSlug(slug: string): boolean {
	return SLUG_RE.test(slug);
}

export function isContentType(value: string): value is ContentType {
	return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isContentLang(value: string): value is ContentLang {
	return (CONTENT_LANGS as readonly string[]).includes(value);
}

// Страховка на случай, если шаблон выше ослабят.
function assertInside(type: ContentType, slug: string): void {
	if (!isValidSlug(slug)) {
		throw new Error(`Некорректный slug: ${JSON.stringify(slug)}`);
	}
	const base = resolve(contentDir(type));
	const target = resolve(unitDir(type, slug));
	const rel = relative(base, target);
	if (isAbsolute(rel) || rel === "" || rel.startsWith("..")) {
		throw new Error(`Slug выходит за пределы каталога: ${slug}`);
	}
}

export function unitExists(type: ContentType, slug: string): boolean {
	assertInside(type, slug);
	return fs.existsSync(unitDir(type, slug));
}

export function readUnit(
	type: ContentType,
	slug: string,
	lang: ContentLang,
): ContentUnit | undefined {
	assertInside(type, slug);
	const file = unitFile(type, slug, lang);
	if (!fs.existsSync(file)) return undefined;

	const { frontmatter, body } = parseUnit(fs.readFileSync(file, "utf8"));
	return { type, slug, lang, frontmatter, body };
}

export interface UnitContent {
	frontmatter: Frontmatter;
	body: string;
}

export async function writeUnit(
	type: ContentType,
	slug: string,
	lang: ContentLang,
	content: UnitContent,
): Promise<string> {
	assertInside(type, slug);
	const file = unitFile(type, slug, lang);
	const raw = serializeUnit(content.frontmatter, content.body);
	fs.mkdirSync(unitDir(type, slug), { recursive: true });
	fs.writeFileSync(file, await formatUnit(raw), "utf8");
	return file;
}

/**
 * Создаёт языковую версию. Проверяется файл, а не папка: index.en.md можно
 * создать после index.ru.md, это штатный путь для «Скопировать из RU».
 */
export async function createUnit(
	type: ContentType,
	slug: string,
	lang: ContentLang,
	content: UnitContent,
): Promise<string> {
	if (readUnit(type, slug, lang)) {
		throw new Error(`Файл уже существует: ${type}/${slug}/${lang}`);
	}
	return writeUnit(type, slug, lang, content);
}

export function deleteUnit(type: ContentType, slug: string): boolean {
	assertInside(type, slug);
	const dir = unitDir(type, slug);
	if (!fs.existsSync(dir)) return false;
	fs.rmSync(dir, { recursive: true });
	return true;
}

export function renameUnit(
	type: ContentType,
	slug: string,
	nextSlug: string,
): boolean {
	if (slug === nextSlug) return false;
	if (unitExists(type, nextSlug)) {
		throw new Error(`Единица уже существует: ${type}/${nextSlug}`);
	}
	const from = unitDir(type, slug);
	if (!fs.existsSync(from)) return false;
	fs.renameSync(from, unitDir(type, nextSlug));
	return true;
}

function stringOf(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

export function summarize(type: ContentType, slug: string): UnitSummary {
	assertInside(type, slug);

	const langs: ContentLang[] = [];
	let title = slug;
	let date = "";
	let draft = false;
	let needsTranslation = false;
	let updatedAt = "";

	for (const lang of CONTENT_LANGS) {
		const file = unitFile(type, slug, lang);
		if (!fs.existsSync(file)) continue;
		langs.push(lang);
		const { frontmatter } = parseUnit(fs.readFileSync(file, "utf8"));
		if (lang === "ru") {
			title = stringOf(frontmatter.title, slug);
			date = stringOf(frontmatter.date);
			draft = frontmatter.draft === true;
		}
		if (frontmatter.needs_translation === true) needsTranslation = true;
		updatedAt = fs.statSync(file).mtime.toISOString();
	}

	return { type, slug, langs, title, date, draft, needsTranslation, updatedAt };
}

export function listUnits(type: ContentType): UnitSummary[] {
	const dir = contentDir(type);
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && isValidSlug(entry.name))
		.map((entry) => summarize(type, entry.name))
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAll(): UnitSummary[] {
	return CONTENT_TYPES.flatMap((type) => listUnits(type));
}
