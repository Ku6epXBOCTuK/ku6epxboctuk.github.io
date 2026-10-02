// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureContentTree } from "./paths.ts";

/*
 * Фикстура вместо настоящего дерева. Тест, пишущий в `src/content`, оставляет
 * мусор в рабочей копии и падает, если упадёт посередине; корневой каталог
 * подменить нельзя, он определяется один раз. Поэтому тест создаёт корень с
 * той же раскладкой и передаёт его явно.
 */

export const roots: string[] = [];

export function fixtureRoot(): string {
	const root = fs.mkdtempSync(join(tmpdir(), "content-fixture-"));
	roots.push(root);
	ensureContentTree(root);
	return root;
}

export function dropFixtureRoots(): void {
	for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	roots.length = 0;
}
