// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
	JsonReadError,
	readJsonFile,
	serialize,
	writeJsonFile,
	writeJsonRecord,
} from "./json.ts";

const roots: string[] = [];

function tempDir(): string {
	const dir = fs.mkdtempSync(join(tmpdir(), "content-json-"));
	roots.push(dir);
	return dir;
}

describe("temporary directories", () => {
	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	});

	it("is created and exists", () => {
		expect(fs.existsSync(tempDir())).toBe(true);
	});
});

describe("reading json", () => {
	it("a missing file is undefined, not an exception", () => {
		const dir = tempDir();
		expect(readJsonFile(join(dir, "absent.json"))).toBeUndefined();
	});

	it("reads what was written", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { one: { order: 1 } });
		expect(readJsonFile(file)).toEqual({ one: { order: 1 } });
	});

	it("broken json throws with the file name", () => {
		const dir = tempDir();
		const file = join(dir, "broken.json");
		fs.writeFileSync(file, "{ не json", "utf8");

		let caught: unknown;
		try {
			readJsonFile(file);
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(JsonReadError);
		expect((caught as JsonReadError).file).toBe(file);
	});
});

describe("writing json", () => {
	it("creates missing directories", () => {
		const dir = tempDir();
		const file = join(dir, "deep", "nested", "projects.json");
		writeJsonFile(file, {});

		expect(fs.existsSync(file)).toBe(true);
	});

	it("overwrites the existing file whole", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: { order: 1 }, b: { order: 2 } });
		writeJsonFile(file, { a: { order: 9 } });

		expect(readJsonFile(file)).toEqual({ a: { order: 9 } });
	});

	it("format is tabs and a trailing newline", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: { order: 1 } });

		const raw = fs.readFileSync(file, "utf8");
		expect(raw.endsWith("\n")).toBe(true);
		expect(raw).toContain('\n\t"a"');
		expect(raw).not.toContain("    ");
	});

	it("leaves no temp file", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: 1 });

		expect(fs.readdirSync(dir)).toEqual(["projects.json"]);
	});

	it("the temp file is removed when the write fails", () => {
		const dir = tempDir();
		// NOTE: a directory instead of a file makes rename fail.
		const file = join(dir, "projects.json");
		fs.mkdirSync(file);

		expect(() => writeJsonFile(file, { a: 1 })).toThrow();
		const leftovers = fs.readdirSync(dir);
		expect(leftovers).toEqual(["projects.json"]);
		expect(fs.statSync(file).isDirectory()).toBe(true);
	});
});

describe("key order", () => {
	it("sorted, otherwise git diffs jump for no reason", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonRecord(file, { zebra: 1, alpha: 2, middle: 3 });

		expect(Object.keys(readJsonFile(file) as object)).toEqual([
			"alpha",
			"middle",
			"zebra",
		]);
	});

	it("serialize leaves order alone; writeJsonRecord sorts", () => {
		expect(Object.keys(JSON.parse(serialize({ b: 1, a: 2 })))).toEqual([
			"b",
			"a",
		]);
	});
});
