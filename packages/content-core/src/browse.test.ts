// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import * as fs from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { browseRoots, dirOf, listDirs } from "./browse.ts";

// NOTE: folder browsing is the only place the editor looks outside `src/content`;
// a bug here shows as an empty list or a walk above the disk root.
describe("folder browsing", () => {
	const roots: string[] = [];

	function fixture(): string {
		const base = fs.mkdtempSync(`${process.env.TEMP ?? "."}/browse-`);
		roots.push(base);
		return base;
	}

	function dir(base: string, ...parts: string[]): string {
		const path = join(base, ...parts);
		fs.mkdirSync(path, { recursive: true });
		return path;
	}

	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	});

	it("lists subdirectories and marks repositories", () => {
		const base = fixture();
		dir(base, "example-repo");
		dir(base, "web-site");
		fs.writeFileSync(join(base, "notes.txt"), "не папка");
		// NOTE: worktrees and submodules keep `.git` as a file.
		fs.writeFileSync(
			join(dir(base, "example-repo"), ".git"),
			"gitdir: ../.git/x",
		);

		const { dirs, path, parent } = listDirs(base);

		// NOTE: the path is normalized, so the field never stores a raw disk
		// separator and comparisons keep working.
		expect(path).toBe(resolve(base));
		expect(dirs.map((d) => d.name)).toEqual(["example-repo", "web-site"]);
		expect(dirs.find((d) => d.name === "example-repo")?.isRepo).toBe(true);
		expect(dirs.find((d) => d.name === "web-site")?.isRepo).toBe(false);
		expect(parent).toBe(dirname(resolve(base)));
	});

	it("returns a ready path: the form does not join it", () => {
		const base = fixture();
		dir(base, "nested");

		const entry = listDirs(base).dirs[0];

		expect(entry?.full).toBe(resolve(base, "nested"));
	});

	it("hides hidden and service folders", () => {
		const base = fixture();
		dir(base, ".git");
		dir(base, ".cache");
		dir(base, "node_modules");
		dir(base, "project");

		expect(listDirs(base).dirs.map((d) => d.name)).toEqual(["project"]);
	});

	it("returns an empty listing for a missing folder instead of throwing", () => {
		const base = fixture();
		const missing = join(base, "нет-такой");

		const listing = listDirs(missing);

		expect(listing.dirs).toEqual([]);
		// NOTE: you can still climb out of a missing folder, otherwise browsing
		// gets stuck.
		expect(listing.parent).toBeTypeOf("string");
	});

	it("does not throw when an existing folder cannot be read", () => {
		const base = fixture();
		const locked = dir(base, "locked");
		fs.chmodSync(locked, 0o000);

		try {
			// NOTE: permissions do not work on Windows, so skip instead of
			// writing a test that lies.
			if (process.platform === "win32") return;
			expect(listDirs(locked).dirs).toEqual([]);
		} finally {
			fs.chmodSync(locked, 0o755);
		}
	});

	it("an empty value opens browsing at the site root", () => {
		const base = fixture();

		expect(dirOf(undefined, base)).toBe(resolve(base));
		expect(dirOf("   ", base)).toBe(resolve(base));
	});

	it("a relative path resolves from the site root", () => {
		const base = fixture();

		expect(dirOf("../example-repo", base)).toBe(
			resolve(base, "../example-repo"),
		);
	});

	it("an absolute path stays as is", () => {
		const base = fixture();
		const absolute = dir(base, "target");

		expect(dirOf(absolute, "C:\\совсем\\другое\\место")).toBe(absolute);
	});

	it("offers the parent and above, but not the disk root", () => {
		const out = browseRoots(fixture());

		expect(out.length).toBeGreaterThan(0);
		for (const root of out) expect(root).not.toBe(parse(out[0]).root);
	});
});
