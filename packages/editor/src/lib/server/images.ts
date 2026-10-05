import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import sharp from "sharp";
import { imagesDir } from "@ku6epxboctuk/content-core";
import { isValidSlug } from "@ku6epxboctuk/content-core/shared";

export type ImageKind = "banner" | "content";

const KB = 1024;

export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 630;
export const CONTENT_MAX_WIDTH = 1200;
export const WEBP_QUALITY = 82;
export const MAX_UPLOAD_MB = 25;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * KB * KB;
export const SITE_PREFIX = "/images/";

const RANDOM_BYTES = 4;
const GIF_MAGIC = "GIF";
const GIF_MAGIC_LENGTH = 3;
const SVG_TYPES = new Set(["image/svg+xml"]);
const PASS_THROUGH = new Set(["image/gif"]);

export interface ProcessedImage {
	path: string;
	file: string;
	width: number;
	height: number;
	bytes: number;
	passThrough: boolean;
}

function isGif(buffer: Buffer): boolean {
	return buffer.subarray(0, GIF_MAGIC_LENGTH).toString("ascii") === GIF_MAGIC;
}

function extensionFor(mimeType: string): string {
	const [, subtype = ""] = mimeType.split("/");
	return subtype === "jpeg" ? "jpg" : subtype;
}

function resolveInImages(sitePath: string, dir: string): string | null {
	if (!sitePath.startsWith(SITE_PREFIX)) return null;
	const base = resolve(dir);
	const target = resolve(join(base, sitePath.slice(SITE_PREFIX.length)));
	const rel = relative(base, target);
	if (isAbsolute(rel) || rel === "" || rel.startsWith("..")) return null;
	return target;
}

export function removeImage(sitePath: string, dir = imagesDir()): boolean {
	const target = resolveInImages(sitePath, dir);
	if (!target || !fs.existsSync(target)) return false;
	fs.rmSync(target);
	return true;
}

export async function saveImage(input: {
	buffer: Buffer;
	mimeType: string;
	kind: ImageKind;
	slug: string;
	dir?: string;
	/** Готовый stem вместо случайного — для парных файлов вроде тематических вариантов. */
	stem?: string;
}): Promise<ProcessedImage> {
	const { buffer, mimeType, kind, slug } = input;
	const dir = input.dir ?? imagesDir();

	if (buffer.length === 0) throw new Error("Файл пустой");
	if (buffer.length > MAX_UPLOAD_BYTES) {
		throw new Error(`Файл больше ${MAX_UPLOAD_MB} МБ`);
	}
	if (SVG_TYPES.has(mimeType)) {
		throw new Error("SVG не поддерживается, сохрани как PNG");
	}

	const base = isValidSlug(slug) ? slug : "img";
	const stem =
		input.stem ?? `${base}-${randomBytes(RANDOM_BYTES).toString("hex")}`;

	fs.mkdirSync(dir, { recursive: true });

	// Анимация в webp не переносится, поэтому GIF остаётся как есть.
	if (isGif(buffer) || PASS_THROUGH.has(mimeType)) {
		const file = `${stem}.${extensionFor(mimeType) || "gif"}`;
		fs.writeFileSync(join(dir, file), buffer);
		const meta = await sharp(buffer).metadata();
		return {
			path: `${SITE_PREFIX}${file}`,
			file,
			width: meta.width ?? 0,
			height: meta.height ?? 0,
			bytes: buffer.length,
			passThrough: true,
		};
	}

	const pipeline = sharp(buffer).rotate();

	const resized =
		kind === "banner"
			? pipeline.resize(BANNER_WIDTH, BANNER_HEIGHT, {
					fit: "cover",
					position: "centre",
				})
			: pipeline.resize(CONTENT_MAX_WIDTH, undefined, {
					fit: "inside",
					withoutEnlargement: true,
				});

	const { data, info } = await resized
		.webp({ quality: WEBP_QUALITY })
		.toBuffer({ resolveWithObject: true });

	const file = `${stem}.webp`;
	fs.writeFileSync(join(dir, file), data);

	return {
		path: `${SITE_PREFIX}${file}`,
		file,
		width: info.width,
		height: info.height,
		bytes: info.size,
		passThrough: false,
	};
}
