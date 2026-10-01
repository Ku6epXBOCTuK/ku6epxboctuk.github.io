import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SchemaType } from "./types.ts";

const MARKER = "pnpm-workspace.yaml";

let cachedRoot: string | undefined;

// Ищем вверх от этого файла, а не от process.cwd(): запуск из вложенной
// папки не должен ломать пути.
export function repoRoot(): string {
	if (cachedRoot) return cachedRoot;

	const start = dirname(fileURLToPath(import.meta.url));
	let dir = start;

	for (;;) {
		if (existsSync(join(dir, MARKER))) {
			cachedRoot = dir;
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error(`${MARKER} не найден выше ${start}`);
		}
		dir = parent;
	}
}

const FOLDER: Record<SchemaType, string> = {
	post: "posts",
	article: "articles",
	project: "projects",
	weekly: "weekly",
};

/**
 * Имена файлов общих данных. Не выводится из `FOLDER`: у `articles` папка
 * `articles`, а файл должен быть `articles.json`, и по plural правило
 * «папка + s» дало бы `weeklys.json`.
 */
const META_FILE: Record<SchemaType, string> = {
	post: "posts.json",
	article: "articles.json",
	project: "projects.json",
	weekly: "weekly.json",
};

export function contentRoot(): string {
	return join(repoRoot(), "src", "content");
}

export function contentDir(type: SchemaType): string {
	return join(contentRoot(), FOLDER[type]);
}

export function unitDir(type: SchemaType, slug: string): string {
	return join(contentDir(type), slug);
}

export function unitFile(type: SchemaType, slug: string, lang: string): string {
	return join(unitDir(type, slug), `index.${lang}.md`);
}

/**
 * Общие поля типа: один json на весь тип, запись — по slug. Переводимые и
 * локальные сюда не попадают.
 */
export function metaFile(type: SchemaType): string {
	return join(contentRoot(), META_FILE[type]);
}

/**
 * Локальные поля типа: тот же json плюс `.local`, файл в гитигноре. Сюда
 * складываются факты о машине — пути к клонам.
 */
export function localFile(type: SchemaType): string {
	const name = META_FILE[type].replace(/\.json$/, ".local.json");
	return join(contentRoot(), name);
}

export function imagesDir(): string {
	return join(repoRoot(), "static", "images");
}
