import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ContentType } from "./types.ts";

const MARKER = "pnpm-workspace.yaml";

let cachedRoot: string | undefined;

/**
 * Корень репозитория. Ищем вверх от этого файла, а не от process.cwd() —
 * иначе путь ломается при запуске из вложенной папки.
 */
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

const FOLDER: Record<ContentType, string> = {
	post: "posts",
	article: "articles",
	project: "projects",
};

export function contentRoot(): string {
	return join(repoRoot(), "src", "content");
}

export function contentDir(type: ContentType): string {
	return join(contentRoot(), FOLDER[type]);
}

export function unitDir(type: ContentType, slug: string): string {
	return join(contentDir(type), slug);
}

export function unitFile(
	type: ContentType,
	slug: string,
	lang: string,
): string {
	return join(unitDir(type, slug), `index.${lang}.md`);
}

export function imagesDir(): string {
	return join(repoRoot(), "static", "images");
}
