// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
	BANNER_HEIGHT,
	BANNER_WIDTH,
	CONTENT_MAX_WIDTH,
	MAX_UPLOAD_BYTES,
	removeImage,
	saveImage,
} from "./images.ts";

const dirs: string[] = [];

function tmpDir(): string {
	const dir = fs.mkdtempSync(join(tmpdir(), "editor-images-"));
	dirs.push(dir);
	return dir;
}

describe("временные каталоги", () => {
	afterAll(() => {
		for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
	});

	it("начинаются пустыми", () => {
		expect(dirs).toEqual([]);
	});
});

async function makePng(width: number, height: number): Promise<Buffer> {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 200, g: 40, b: 90 },
		},
	})
		.png()
		.toBuffer();
}

describe("обложка приводится к 1200×630", () => {
	it("обрезает большую картинку по центру", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(3000, 2000),
			mimeType: "image/png",
			kind: "banner",
			slug: "brul",
			dir,
		});

		expect(saved.width).toBe(BANNER_WIDTH);
		expect(saved.height).toBe(BANNER_HEIGHT);
		expect(saved.path).toMatch(/^\/images\/brul-[0-9a-f]{8}\.webp$/);
		expect(saved.passThrough).toBe(false);
	});

	it("увеличивает маленькую до нужного размера", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(200, 150),
			mimeType: "image/png",
			kind: "banner",
			slug: "brul",
			dir,
		});

		expect(saved.width).toBe(BANNER_WIDTH);
		expect(saved.height).toBe(BANNER_HEIGHT);
	});

	it("файл на диске — webp нужного размера", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(3000, 2000),
			mimeType: "image/png",
			kind: "banner",
			slug: "brul",
			dir,
		});

		const file = join(dir, saved.file);
		expect(fs.existsSync(file)).toBe(true);

		const meta = await sharp(file).metadata();
		expect(meta.format).toBe("webp");
		expect(meta.width).toBe(BANNER_WIDTH);
		expect(meta.height).toBe(BANNER_HEIGHT);
	});
});

describe("картинка в тексте", () => {
	it("ширину ужимает, высоту не трогает", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(2400, 1200),
			mimeType: "image/png",
			kind: "content",
			slug: "post",
			dir,
		});

		expect(saved.width).toBe(CONTENT_MAX_WIDTH);
		expect(saved.height).toBe(600);
	});

	it("мелкую не раздувает", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(300, 200),
			mimeType: "image/png",
			kind: "content",
			slug: "post",
			dir,
		});

		expect(saved.width).toBe(300);
		expect(saved.height).toBe(200);
	});

	it("портретная остаётся портретной", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(2000, 4000),
			mimeType: "image/png",
			kind: "content",
			slug: "post",
			dir,
		});

		expect(saved.width).toBe(CONTENT_MAX_WIDTH);
		expect(saved.height).toBe(CONTENT_MAX_WIDTH * 2);
	});
});

describe("GIF не пережимается", () => {
	it("остаётся gif с исходным размером", async () => {
		const dir = tmpDir();
		const gif = await sharp({
			create: { width: 64, height: 48, channels: 3, background: "#0f0" },
		})
			.gif()
			.toBuffer();

		const saved = await saveImage({
			buffer: gif,
			mimeType: "image/gif",
			kind: "content",
			slug: "anim",
			dir,
		});

		expect(saved.passThrough).toBe(true);
		expect(saved.file).toMatch(/\.gif$/);
		expect(saved.width).toBe(64);
		expect(saved.height).toBe(48);
	});
});

describe("отказы", () => {
	it("пустой файл", async () => {
		await expect(
			saveImage({
				buffer: Buffer.alloc(0),
				mimeType: "image/png",
				kind: "banner",
				slug: "x",
				dir: tmpDir(),
			}),
		).rejects.toThrow(/пустой/);
	});

	it("слишком большой", async () => {
		const dir = tmpDir();
		await expect(
			saveImage({
				buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1),
				mimeType: "image/png",
				kind: "banner",
				slug: "x",
				dir,
			}),
		).rejects.toThrow(/больше/);
	});

	it("SVG", async () => {
		await expect(
			saveImage({
				buffer: Buffer.from("<svg/>"),
				mimeType: "image/svg+xml",
				kind: "banner",
				slug: "x",
				dir: tmpDir(),
			}),
		).rejects.toThrow(/SVG/);
	});
});

describe("removeImage", () => {
	it("удаляет файл по пути /images/…", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(100, 100),
			mimeType: "image/png",
			kind: "content",
			slug: "del",
			dir,
		});

		expect(removeImage(saved.path, dir)).toBe(true);
		expect(fs.existsSync(join(dir, saved.file))).toBe(false);
		expect(removeImage(saved.path, dir)).toBe(false);
	});

	it.each([
		["чужой путь", "/static/x.webp"],
		["обход каталога", "/images/../secrets.txt"],
		["глубокий обход", "/images/../../x.webp"],
		["пустой", ""],
	])("не трогает: %s", (_name, path) => {
		const dir = tmpDir();
		fs.writeFileSync(join(dir, "..", "secrets.txt"), "секрет");
		expect(removeImage(path, dir)).toBe(false);
	});
});

describe("slug в имени файла", () => {
	it.each([
		["brul", "brul"],
		["../etc", "img"],
		["Bad Slug", "img"],
		["", "img"],
	])("%s → %s", async (slug, expected) => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(10, 10),
			mimeType: "image/png",
			kind: "content",
			slug,
			dir,
		});
		expect(saved.file.startsWith(`${expected}-`)).toBe(true);
	});
});
