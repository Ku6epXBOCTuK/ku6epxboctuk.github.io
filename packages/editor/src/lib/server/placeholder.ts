import sharp from "sharp";
import { saveImage, type ProcessedImage } from "./images.ts";

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#6e6e6e";
const FG = "#ffffff";
const ACCENT = "#e29480";

const EYEBROW = "Ku6epXBOCTuK · проект";
const MONOGRAM = "KX";

const FONT = "Nunito, 'Segoe UI', 'DejaVu Sans', sans-serif";

// Ширина текста на глаз, без движка шрифтов: жирный гротеск ≈ 0.58 от кегля.
const MAX_TEXT_WIDTH = 980;
const CHAR_RATIO = 0.58;

const MAX_FONT_SIZE = 104;
const MIN_FONT_SIZE = 24;
const FONT_STEP = 0.85;
const SIZES = Array.from({ length: 12 }, (_, index) =>
	Math.round(MAX_FONT_SIZE * FONT_STEP ** index),
).filter((size) => size >= MIN_FONT_SIZE);

// Базовая линия: заглавные стоят выше середины примерно на 0.36 кегля.
const BASELINE_RATIO = 0.36;

const PAD_X = 90;
const TOP_BAR_HEIGHT = 10;
const EYEBROW_SIZE = 30;
const EYEBROW_Y = 112;
const MONOGRAM_SIZE = 180;
const MONOGRAM_X = 1110;
const MONOGRAM_Y = 560;
const DASH_WIDTH = 96;
const DASH_HEIGHT = 6;
const DASH_Y = 74;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function layout(label: string): { size: number } {
	for (const size of SIZES) {
		const maxChars = Math.floor(MAX_TEXT_WIDTH / (size * CHAR_RATIO));
		if (label.length <= maxChars) return { size };
	}
	return { size: SIZES[SIZES.length - 1] as number };
}

export function placeholderSvg(name: string): string {
	const label = name.trim() || "без названия";
	const { size } = layout(label);
	const top = Math.round(HEIGHT / 2 + size * BASELINE_RATIO);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect x="0" y="0" width="${WIDTH}" height="${TOP_BAR_HEIGHT}" fill="${ACCENT}"/>
  <text x="${PAD_X}" y="${EYEBROW_Y}" font-family="${FONT}" font-size="${EYEBROW_SIZE}" letter-spacing="4" fill="${FG}" opacity="0.72">${escapeXml(EYEBROW)}</text>
  <text x="${PAD_X}" y="${top}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${FG}">${escapeXml(label)}</text>
  <text x="${MONOGRAM_X}" y="${MONOGRAM_Y}" text-anchor="end" font-family="${FONT}" font-size="${MONOGRAM_SIZE}" font-weight="700" fill="${FG}" opacity="0.13">${escapeXml(MONOGRAM)}</text>
  <rect x="${PAD_X}" y="${HEIGHT - DASH_Y}" width="${DASH_WIDTH}" height="${DASH_HEIGHT}" fill="${ACCENT}"/>
</svg>`;
}

export async function createProjectPlaceholder(
	name: string,
	slug: string,
): Promise<ProcessedImage> {
	const png = await sharp(Buffer.from(placeholderSvg(name)))
		.png()
		.toBuffer();

	return saveImage({
		buffer: png,
		mimeType: "image/png",
		kind: "banner",
		slug,
	});
}
