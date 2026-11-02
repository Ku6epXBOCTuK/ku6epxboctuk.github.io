import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// NOTE: the browser cannot reveal a directory path (`showDirectoryPicker` hides
// it deliberately), so the loopback server lists folders and the form draws them.

const SKIP = new Set([".git", "node_modules", ".cache", ".pnpm-store"]);

const BROWSE_DEPTH = 3;

export interface DirEntry {
	name: string;

	full: string;

	isRepo: boolean;
}

export interface DirListing {
	path: string;

	parent: string | null;
	dirs: DirEntry[];
}

export function browseRoots(base: string): string[] {
	const out: string[] = [];
	let current = base;

	for (let depth = 0; depth < BROWSE_DEPTH; depth++) {
		const parent = dirname(current);
		if (parent === current) break;
		out.push(parent);
		current = parent;
	}

	return out;
}

function isDirectory(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

// NOTE: a missing or unreadable folder yields an empty listing; browsing must
// survive permissions instead of throwing.
export function listDirs(path: string): DirListing {
	const target = resolve(path);
	const parentOf = dirname(target);
	const parent = parentOf === target ? null : parentOf;
	const dirs: DirEntry[] = [];

	if (!isDirectory(target)) {
		return { path: target, parent, dirs };
	}

	let names: string[];
	try {
		names = readdirSync(target);
	} catch {
		return { path: target, parent, dirs };
	}

	for (const name of names.sort((a, b) => a.localeCompare(b))) {
		if (SKIP.has(name) || name.startsWith(".")) continue;
		const child = join(target, name);
		if (!isDirectory(child)) continue;
		dirs.push({
			name,
			full: child,
			isRepo: existsSync(join(child, ".git")),
		});
	}

	return { path: target, parent, dirs };
}

// NOTE: an empty value opens the browsable root, not the disk root.
export function dirOf(value: string | undefined, base: string): string {
	const trimmed = value?.trim();
	return trimmed ? resolve(base, trimmed) : resolve(base);
}
