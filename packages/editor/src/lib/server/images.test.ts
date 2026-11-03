// NOTE: these tests need the node environment, not a DOM.
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

describe("temp directories", () => {
	afterAll(() => {
		for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
	});

	it("start empty", () => {
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

describe("a banner is fitted to 1200x630", () => {
	it("crops a large image from the center", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(3000, 2000),
			mimeType: "image/png",
			kind: "banner",
			slug: "example-repo",
			dir,
		});

		expect(saved.width).toBe(BANNER_WIDTH);
		expect(saved.height).toBe(BANNER_HEIGHT);
		expect(saved.path).toMatch(/^\/images\/example-repo-[0-9a-f]{8}\.webp$/);
		expect(saved.passThrough).toBe(false);
	});

	it("upscales a small image to the target size", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(200, 150),
			mimeType: "image/png",
			kind: "banner",
			slug: "example-repo",
			dir,
		});

		expect(saved.width).toBe(BANNER_WIDTH);
		expect(saved.height).toBe(BANNER_HEIGHT);
	});

	it("the file on disk is a webp of the target size", async () => {
		const dir = tmpDir();
		const saved = await saveImage({
			buffer: await makePng(3000, 2000),
			mimeType: "image/png",
			kind: "banner",
			slug: "example-repo",
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

describe("an image in the body", () => {
	it("shrinks the width and keeps the height", async () => {
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

	it("does not upscale a small one", async () => {
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

	it("a portrait stays a portrait", async () => {
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

describe("a GIF is not re-encoded", () => {
	it("stays a gif at the original size", async () => {
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

describe("rejections", () => {
	it("empty file", async () => {
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

	it("too large", async () => {
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
	it("deletes the file at an /images/... path", async () => {
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
		["foreign path", "/static/x.webp"],
		["directory traversal", "/images/../secrets.txt"],
		["deep traversal", "/images/../../x.webp"],
		["empty", ""],
	])("leaves it alone: %s", (_name, path) => {
		const dir = tmpDir();
		fs.writeFileSync(join(dir, "..", "secrets.txt"), "секрет");
		expect(removeImage(path, dir)).toBe(false);
	});
});

describe("slug in the file name", () => {
	it.each([
		["example-repo", "example-repo"],
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
