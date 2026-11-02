// NOTE: these tests touch the filesystem, so they run in the node environment.
// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureContentTree } from "./paths.ts";

// NOTE: the root is computed once and cannot be swapped, so tests build the same
// layout in a temp dir and pass it explicitly.
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
