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

describe("временные каталоги", () => {
	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	});

	it("создан и живёт", () => {
		expect(fs.existsSync(tempDir())).toBe(true);
	});
});

describe("чтение json", () => {
	it("нет файла — undefined, а не исключение", () => {
		const dir = tempDir();
		expect(readJsonFile(join(dir, "absent.json"))).toBeUndefined();
	});

	it("читает записанное", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { one: { order: 1 } });
		expect(readJsonFile(file)).toEqual({ one: { order: 1 } });
	});

	it("битый json падает с именем файла", () => {
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

describe("запись json", () => {
	it("создаёт недостающие каталоги", () => {
		const dir = tempDir();
		const file = join(dir, "deep", "nested", "projects.json");
		writeJsonFile(file, {});

		expect(fs.existsSync(file)).toBe(true);
	});

	it("перезаписывает существующий файл целиком", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: { order: 1 }, b: { order: 2 } });
		writeJsonFile(file, { a: { order: 9 } });

		expect(readJsonFile(file)).toEqual({ a: { order: 9 } });
	});

	it("формат — табы и перевод строки в конце", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: { order: 1 } });

		const raw = fs.readFileSync(file, "utf8");
		expect(raw.endsWith("\n")).toBe(true);
		expect(raw).toContain('\n\t"a"');
		expect(raw).not.toContain("    ");
	});

	it("не оставляет временный файл", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonFile(file, { a: 1 });

		expect(fs.readdirSync(dir)).toEqual(["projects.json"]);
	});

	it("временный файл убирается, если запись сорвалась", () => {
		const dir = tempDir();
		// Каталог вместо файла: rename в него не пройдёт.
		const file = join(dir, "projects.json");
		fs.mkdirSync(file);

		expect(() => writeJsonFile(file, { a: 1 })).toThrow();
		const leftovers = fs.readdirSync(dir);
		expect(leftovers).toEqual(["projects.json"]);
		expect(fs.statSync(file).isDirectory()).toBe(true);
	});
});

describe("порядок ключей", () => {
	it("сортируется, иначе диффы в git скачут без причины", () => {
		const dir = tempDir();
		const file = join(dir, "projects.json");
		writeJsonRecord(file, { zebra: 1, alpha: 2, middle: 3 });

		expect(Object.keys(readJsonFile(file) as object)).toEqual([
			"alpha",
			"middle",
			"zebra",
		]);
	});

	it("serialize не трогает порядок — это делает writeJsonRecord", () => {
		expect(Object.keys(JSON.parse(serialize({ b: 1, a: 2 })))).toEqual([
			"b",
			"a",
		]);
	});
});
