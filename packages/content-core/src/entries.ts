import * as fs from "node:fs";
import { join } from "node:path";
import { ALL_FIELDS, fieldsWithScope, type FieldScope } from "./fields.ts";
import { formatUnit } from "./format.ts";
import { readJsonFile, writeJsonRecord } from "./json.ts";
import { isValidSlug } from "./slug.ts";
import {
	contentDir,
	localFile,
	metaFile,
	repoRoot,
	unitDir,
	unitFile,
} from "./paths.ts";
import {
	emptyEntry,
	flattenEntry,
	type Entry,
	type EntryInput,
	type EntrySummary,
	type LocalRecord,
	type SaveResult,
	type Version,
} from "./entry-types.ts";
import { CONTENT_LANGS, type ContentLang, type SchemaType } from "./types.ts";
import { parseUnit, serializeUnit } from "./yaml.ts";

/*
 * Единственный, кто знает про три файла единицы. Снаружи — `Entry`: склеенное
 * представление, где потребителю всё равно, что переводимое лежит в md, а
 * общее в json.
 *
 * Раскладка определяется только `scope` из схемы. Значение, пришедшее не в той
 * корзине, куда его положил бы scope, всё равно уедет в правильный файл: иначе
 * перенос поля между файлами означал бы правки в редакторе, а это ровно то,
 * ради чего схема и вынесена отдельно.
 */

/**
 * Корень передаётся явно: тесты пишут в фикстуру, а не в рабочее дерево.
 */
function assertSlug(slug: string): void {
	if (!isValidSlug(slug)) throw new Error(`Некорректный slug: ${slug}`);
}

function scopeOf(type: SchemaType, name: string): FieldScope | undefined {
	return ALL_FIELDS[type].find((field) => field.name === name)?.scope;
}

function namesOf(type: SchemaType, scope: FieldScope): string[] {
	return fieldsWithScope(type, scope).map((field) => field.name);
}

function isEmptyValue(value: unknown): boolean {
	if (value === undefined || value === null || value === "") return true;
	return Array.isArray(value) && value.length === 0;
}

function pick(
	source: Record<string, unknown>,
	names: readonly string[],
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const name of names) {
		const value = source[name];
		if (!isEmptyValue(value)) out[name] = value;
	}
	return out;
}

/**
 * Плоские записи по типам. Файл один на тип, поэтому читается целиком и
 * меняется в памяти, а на диск пишется снова весь.
 */
function readMeta<T>(type: SchemaType, root: string): Record<string, unknown> {
	const file = metaFile(type, root);
	const record = (readJsonFile<Record<string, T>>(file) ?? {}) as Record<
		string,
		T
	>;
	return { ...record };
}

function readLocal(type: SchemaType, root: string): Record<string, unknown> {
	const file = localFile(type, root);
	return {
		...((readJsonFile<LocalRecord>(file) ?? {}) as Record<string, unknown>),
	};
}

function readVersion(
	type: SchemaType,
	slug: string,
	lang: ContentLang,
	root: string,
): Version {
	const file = unitFile(type, slug, lang, root);
	if (!fs.existsSync(file)) return { frontmatter: {}, body: "" };

	const { frontmatter, body } = parseUnit(fs.readFileSync(file, "utf8"));
	return { frontmatter, body };
}

/**
 * Пишет файл, только если содержимое изменилось. Без этого каждое сохранение
 * трогало бы mtime у всех файлов типа, и список единиц пересортировывался бы
 * по бесполезному признаку.
 */
async function writeIfChanged(file: string, raw: string): Promise<boolean> {
	const formatted = await formatUnit(raw);
	if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === formatted) {
		return false;
	}

	fs.mkdirSync(join(file, ".."), { recursive: true });
	fs.writeFileSync(file, formatted, "utf8");
	return true;
}

export function loadEntry(
	type: SchemaType,
	slug: string,
	root: string = repoRoot(),
): Entry | undefined {
	assertSlug(slug);

	const meta = readMeta(type, root);
	const local = readLocal(type, root);
	const entry = emptyEntry(type, slug);

	if (!fs.existsSync(unitDir(type, slug, root))) return undefined;

	for (const lang of CONTENT_LANGS) {
		entry.versions[lang] = readVersion(type, slug, lang, root);
	}

	entry.shared = (meta[slug] ?? {}) as Entry["shared"];
	entry.local = (local[slug] ?? {}) as Entry["local"];
	return entry;
}

export function entryExists(
	type: SchemaType,
	slug: string,
	root: string = repoRoot(),
): boolean {
	assertSlug(slug);
	return fs.existsSync(unitDir(type, slug, root));
}

export interface SplitEntry {
	shared: Record<string, unknown>;
	local: Record<string, unknown>;
	/** По языку: во frontmatter попадает только `translatable`. */
	frontmatter: Record<ContentLang, Record<string, unknown>>;
	bodies: Record<ContentLang, string>;
}

/**
 * Разбор `Entry` на три файла. Ведёт себя по `scope`, а не по тому, в какой
 * корзине поле лежало на входе, поэтому общие значения, случайно попавшие в
 * языковой frontmatter, уезжают в json, а не теряются.
 */
export function splitEntry(type: SchemaType, entry: Entry): SplitEntry {
	const translatable = namesOf(type, "translatable");
	const shared = namesOf(type, "shared");
	const local = namesOf(type, "local");

	// Поле вне схемы не знает, где ему жить, поэтому просто не попадает ни в
	// один файл. Об этом сообщает валидация, а не отказ сохранять.
	const flat: Record<string, unknown> = { ...entry.local, ...entry.shared };
	for (const lang of CONTENT_LANGS) {
		for (const [key, value] of Object.entries(
			entry.versions[lang]?.frontmatter ?? {},
		)) {
			if (scopeOf(type, key)) flat[key] = value;
		}
	}

	// Переводимое, лежащее в общей или локальной корзине, читается как «одно
	// значение на оба языка». Языковой frontmatter поверх перекрывает его — так
	// правило «правит свой язык» работает даже если значение положили не туда.
	const baseline = pick(flat, translatable);

	const frontmatter = {} as Record<ContentLang, Record<string, unknown>>;
	const bodies = {} as Record<ContentLang, string>;

	for (const lang of CONTENT_LANGS) {
		const own: Record<string, unknown> = { ...baseline };
		for (const [key, value] of Object.entries(
			entry.versions[lang]?.frontmatter ?? {},
		)) {
			if (scopeOf(type, key) !== "translatable") continue;
			if (isEmptyValue(value)) delete own[key];
			else own[key] = value;
		}
		frontmatter[lang] = own;
		bodies[lang] = entry.versions[lang]?.body ?? "";
	}

	return {
		shared: pick(flat, shared),
		local: pick(flat, local),
		frontmatter,
		bodies,
	};
}

export async function saveEntry(
	type: SchemaType,
	slug: string,
	input: EntryInput,
	root: string = repoRoot(),
): Promise<SaveResult> {
	assertSlug(slug);

	const split = splitEntry(type, { ...input, type, slug });
	const written: string[] = [];

	for (const lang of CONTENT_LANGS) {
		const file = unitFile(type, slug, lang, root);
		const raw = serializeUnit(split.frontmatter[lang], split.bodies[lang]);
		if (await writeIfChanged(file, raw)) written.push(file);
	}

	const meta = readMeta(type, root);
	const local = readLocal(type, root);

	const nextMeta = { ...meta };
	if (Object.keys(split.shared).length === 0) delete nextMeta[slug];
	else nextMeta[slug] = split.shared as never;
	writeRecords(metaFile(type, root), nextMeta);

	const nextLocal = { ...local };
	if (Object.keys(split.local).length === 0) delete nextLocal[slug];
	else nextLocal[slug] = split.local as never;
	writeRecords(localFile(type, root), nextLocal);

	return { entry: loadEntry(type, slug) as Entry, written };
}

/**
 * Пишет плоскую запись или убирает файл, если записей не осталось: в git не
 * должен лежать `{}` без единой записи. Записи с пустым объектом тоже
 * вычищаются — иначе файл пережил бы очистку последнего поля.
 */
function writeRecords(file: string, records: Record<string, unknown>): void {
	const filled = Object.fromEntries(
		Object.entries(records).filter(([, value]) => {
			if (value === undefined || value === null) return false;
			if (typeof value === "object" && !Array.isArray(value)) {
				return Object.keys(value as object).length > 0;
			}
			return true;
		}),
	);

	if (Object.keys(filled).length === 0) {
		fs.rmSync(file, { force: true });
		return;
	}

	writeJsonRecord(file, filled);
}

export function listEntries(
	type: SchemaType,
	root: string = repoRoot(),
): EntrySummary[] {
	const meta = readMeta(type, root);
	const local = readLocal(type, root);
	const dir = contentDir(type, root);

	const slugs = new Set([
		...Object.keys(meta),
		...Object.keys(local),
		...safeDirNames(dir),
	]);

	const out: EntrySummary[] = [];
	for (const slug of slugs) {
		if (!isValidSlug(slug)) continue;
		const entry = loadEntry(type, slug, root);
		if (!entry) continue;
		out.push(summarize(type, slug, entry, root));
	}

	return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function safeDirNames(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

function summarize(
	type: SchemaType,
	slug: string,
	entry: Entry,
	root: string,
): EntrySummary {
	const langs = CONTENT_LANGS.filter(
		(lang) =>
			entry.versions[lang].body.trim() !== "" ||
			Object.keys(entry.versions[lang].frontmatter).length > 0,
	);

	let updatedAt = "";
	for (const lang of CONTENT_LANGS) {
		const file = unitFile(type, slug, lang, root);
		if (!fs.existsSync(file)) continue;
		const mtime = fs.statSync(file).mtime.toISOString();
		if (mtime > updatedAt) updatedAt = mtime;
	}

	const title = entry.versions.ru.frontmatter.title;

	return {
		type,
		slug,
		langs,
		title: typeof title === "string" ? title : slug,
		draft: entry.shared.draft === true,
		needsTranslation: entry.versions.en.frontmatter.needs_translation === true,
		updatedAt,
	};
}

export async function createEntry(
	type: SchemaType,
	slug: string,
	input: EntryInput,
	root: string = repoRoot(),
): Promise<Entry> {
	assertSlug(slug);
	if (entryExists(type, slug, root)) {
		throw new Error(`Единица уже существует: ${type}/${slug}`);
	}
	await saveEntry(type, slug, input, root);
	return loadEntry(type, slug, root) as Entry;
}

export function deleteEntry(
	type: SchemaType,
	slug: string,
	root: string = repoRoot(),
): boolean {
	assertSlug(slug);
	const dir = unitDir(type, slug, root);
	if (!fs.existsSync(dir)) return false;

	fs.rmSync(dir, { recursive: true, force: true });

	for (const file of [metaFile(type, root), localFile(type, root)]) {
		const record = readJsonFile<Record<string, unknown>>(file);
		if (!record || !(slug in record)) continue;
		delete record[slug];
		if (Object.keys(record).length === 0) fs.rmSync(file, { force: true });
		else writeJsonRecord(file, record);
	}

	return true;
}

/**
 * Переименование меняет и папку, и ключ в json. Сначала папка: если упадёт
 * запись json, расхождение поймает валидация, а не чтение контента.
 */
export function renameEntry(
	type: SchemaType,
	slug: string,
	next: string,
	root: string = repoRoot(),
): boolean {
	assertSlug(slug);
	assertSlug(next);
	if (slug === next) return false;

	const from = unitDir(type, slug, root);
	if (!fs.existsSync(from)) return false;
	if (entryExists(type, next, root)) {
		throw new Error(`Единица уже существует: ${type}/${next}`);
	}

	fs.renameSync(from, unitDir(type, next, root));

	for (const file of [metaFile(type, root), localFile(type, root)]) {
		const record = readJsonFile<Record<string, unknown>>(file);
		if (!record || !(slug in record)) continue;
		const { [slug]: value, ...rest } = record;
		rest[next] = value;
		writeJsonRecord(file, rest);
	}

	return true;
}

export { flattenEntry };
