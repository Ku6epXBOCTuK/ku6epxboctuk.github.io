import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SchemaType } from "./types.ts";

const MARKER = "pnpm-workspace.yaml";

let cachedRoot: string | undefined;

// NOTE: search upward from this module, not `process.cwd()`, so running from a nested folder still resolves paths.
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

// NOTE: file names cannot be derived from `FOLDER`: the plural rule would give
// `weeklys.json`.
const META_FILE: Record<SchemaType, string> = {
	post: "posts.json",
	article: "articles.json",
	project: "projects.json",
	weekly: "weekly.json",
};

// NOTE: the root is passed explicitly because `repoRoot()` is computed once and
// cannot be swapped, and tests must not write into the real tree.
export function contentRoot(root = repoRoot()): string {
	return join(root, "src", "content");
}

export function contentDir(type: SchemaType, root = repoRoot()): string {
	return join(contentRoot(root), FOLDER[type]);
}

export function unitDir(
	type: SchemaType,
	slug: string,
	root = repoRoot(),
): string {
	return join(contentDir(type, root), slug);
}

export function unitFile(
	type: SchemaType,
	slug: string,
	lang: string,
	root = repoRoot(),
): string {
	return join(unitDir(type, slug, root), `index.${lang}.md`);
}

export function metaFile(type: SchemaType, root = repoRoot()): string {
	return join(contentRoot(root), META_FILE[type]);
}

export function localFile(type: SchemaType, root = repoRoot()): string {
	const name = META_FILE[type].replace(/\.json$/, ".local.json");
	return join(contentRoot(root), name);
}

export function imagesDir(root = repoRoot()): string {
	return join(root, "static", "images");
}

export function ensureContentTree(root: string): void {
	mkdirSync(contentDir("post", root), { recursive: true });
	mkdirSync(contentDir("article", root), { recursive: true });
	mkdirSync(contentDir("project", root), { recursive: true });
	mkdirSync(contentDir("weekly", root), { recursive: true });
}
