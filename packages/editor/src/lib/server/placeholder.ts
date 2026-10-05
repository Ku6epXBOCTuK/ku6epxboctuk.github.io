import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { saveImage, type ProcessedImage } from "./images.ts";

const WIDTH = 1200;
const HEIGHT = 630;

interface Variant {
	bg: string;
	fg: string;
	/** Прозрачность узора: на тёмном фоне та же прозрачность читается сильнее. */
	wm: number;
}

const LIGHT: Variant = { bg: "#ece7e3", fg: "#43352f", wm: 0.03 };
const DARK: Variant = { bg: "#4a4451", fg: "#ffffff", wm: 0.018 };
const ACCENT = "#e29480";

const RANDOM_BYTES = 4;

const FONT = "Nunito, 'Segoe UI', 'DejaVu Sans', sans-serif";

const MAX_TEXT_WIDTH = 980;

const TITLE_SIZE = 72;

const PAD_X = 90;
const TOP_BAR_HEIGHT = 10;
const EYEBROW_SIZE = 49;
const EYEBROW_Y = 122;
const EYEBROW_SPACING = 4;
const KIND_SIZE = 39;
const KIND_Y = 192;
const DIVIDER_Y = 146;
const DIVIDER_H = 2;
const TITLE_DASH_OFFSET = 13;
const TITLE_DASH_H = 6;
const TITLE_HALO = 12;
const TITLE_BOTTOM = 90;
const PANEL_W = 340;
const PANEL_H = 227;
const PANEL_Y = 150;
const PANEL_RIGHT = 150;
const PANEL_RADIUS = 18;
const PANEL_STROKE = 7;
const CODE_LINE_H = 18;
const CODE_LINE_X = 36;
const CODE_LINE_Y = 50;
const CODE_LINE_GAP = 44;
const CODE_BAR_LONG = 230;
const CODE_BAR_MID = 190;
const CODE_BAR_SHORT = 140;
const CODE_BAR_TINY = 115;
const CODE_LINE_FAINT = 0.35;
const WATERMARK_TEXT = "Ku6epXBOCTuK";
const WATERMARK_SIZE = 44;
const WATERMARK_TILE_W = 560;
const WATERMARK_TILE_H = 130;
const WATERMARK_TEXT_Y = 60;
const WATERMARK_ANGLE = -18;

const KIND_EN: Record<string, string> = {
	пост: "post",
	статья: "article",
	проект: "project",
};

const ELLIPSIS = "…";
const FALLBACK_LABEL = "без названия";
const NICKNAME = "Ku6epXBOCTuK";

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Кегль заголовка фиксированный: плейсхолдеры должны быть единообразными.
 * Длинное название обрезается многоточием по РЕАЛЬНОЙ ширине (бинарный поиск
 * по измеренным глифам), а не по числу символов: iii и www разной ширины.
 */
async function fitLabel(raw: string): Promise<string> {
	const label = raw.trim() || FALLBACK_LABEL;
	const full = await measureTextWidth(label, TITLE_SIZE);
	if (full.width <= MAX_TEXT_WIDTH) return label;

	let lo = 1;
	let hi = label.length - 1;
	let best = 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const candidate = `${label.slice(0, mid).trimEnd()}${ELLIPSIS}`;
		const { width } = await measureTextWidth(candidate, TITLE_SIZE);
		if (width <= MAX_TEXT_WIDTH) {
			best = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return `${label.slice(0, best).trimEnd()}${ELLIPSIS}`;
}

export interface TextMeasure {
	/** Ширина bbox глифов. */
	width: number;
	/** Левый bearing: сдвиг bbox относительно x текста (бывает 0–несколько px). */
	left: number;
}

/**
 * Точная ширина строки: рендерим текст и обрезаем пустые поля. Единственный
 * способ получить реальные глифовые метрики — librsvg их не отдаёт.
 * threshold 1: фон чисто-белый, иначе trim съедает полупрозрачные края глифов
 * и линия выходит короче текста.
 */
export async function measureTextWidth(
	text: string,
	size: number,
	options: { letterSpacing?: number; weight?: number } = {},
): Promise<TextMeasure> {
	const { letterSpacing = 0, weight = 700 } = options;
	const pad = Math.ceil(size / 2);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(text.length * size) + pad * 2}" height="${size + pad * 2}">
  <rect width="100%" height="100%" fill="#fff"/>
  <text x="${pad}" y="${pad + size}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="#000">${escapeXml(text)}</text>
</svg>`;
	const { info } = await sharp(Buffer.from(svg))
		.png()
		.trim({ threshold: 1 })
		.toBuffer({ resolveWithObject: true });
	// trimOffsetLeft отрицательный: сдвиг контента в исходнике = -trimOffsetLeft,
	// bearing = сдвиг минус x, куда текст был поставлен (pad).
	const trimLeft = info.trimOffsetLeft ?? -pad;
	return { width: info.width, left: -trimLeft - pad };
}

function codePanel(x: number, y: number, variant: Variant): string {
	const lines: Array<[number, string, number]> = [
		[CODE_BAR_MID, ACCENT, 1],
		[CODE_BAR_SHORT, variant.fg, CODE_LINE_FAINT],
		[CODE_BAR_LONG, variant.fg, CODE_LINE_FAINT],
		[CODE_BAR_TINY, ACCENT, 1],
	];

	const bars = lines
		.map(
			([width, fill, opacity], index) =>
				`  <rect x="${x + CODE_LINE_X}" y="${y + CODE_LINE_Y + index * CODE_LINE_GAP}" width="${width}" height="${CODE_LINE_H}" rx="${CODE_LINE_H / 2}" fill="${fill}" opacity="${opacity}"/>`,
		)
		.join("\n");

	return `  <rect x="${x}" y="${y}" width="${PANEL_W}" height="${PANEL_H}" rx="${PANEL_RADIUS}" fill="none" stroke="${ACCENT}" stroke-width="${PANEL_STROKE}"/>
${bars}`;
}

interface TextDims {
	nick: TextMeasure;
	title: TextMeasure;
	label: string;
	size: number;
}

function placeholderSvg(
	kind: string,
	variant: Variant,
	dims: TextDims,
): string {
	const { label, size, nick, title } = dims;
	const titleY = HEIGHT - TITLE_BOTTOM;
	const panelX = WIDTH - PANEL_RIGHT - PANEL_W;
	const kindBoth = KIND_EN[kind] ? `${kind} · ${KIND_EN[kind]}` : kind;
	const dashY = titleY + TITLE_DASH_OFFSET;

	// Полоска под заголовком рвётся на выступающих вниз частях букв: она лежит
	// ПОД текстом, а текст обведён цветом фона — обводка перекрывает линию
	// вокруг глифов. librsvg не вычитает текст из mask, поэтому не маска, а halo.
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="watermark" width="${WATERMARK_TILE_W}" height="${WATERMARK_TILE_H}" patternUnits="userSpaceOnUse" patternTransform="rotate(${WATERMARK_ANGLE})">
      <text x="0" y="${WATERMARK_TEXT_Y}" font-family="${FONT}" font-size="${WATERMARK_SIZE}" font-weight="700" fill="${variant.fg}">${escapeXml(WATERMARK_TEXT)}</text>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${variant.bg}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#watermark)" opacity="${variant.wm}"/>
  <rect x="0" y="0" width="${WIDTH}" height="${TOP_BAR_HEIGHT}" fill="${ACCENT}"/>
  <text x="${PAD_X}" y="${EYEBROW_Y}" font-family="${FONT}" font-size="${EYEBROW_SIZE}" letter-spacing="${EYEBROW_SPACING}" fill="${variant.fg}" opacity="0.72">${escapeXml(NICKNAME)}</text>
  <rect x="${PAD_X + nick.left}" y="${DIVIDER_Y}" width="${nick.width}" height="${DIVIDER_H}" fill="${variant.fg}" opacity="0.4"/>
  <text x="${PAD_X}" y="${KIND_Y}" font-family="${FONT}" font-size="${KIND_SIZE}" letter-spacing="3" fill="${variant.fg}" opacity="0.6">${escapeXml(kindBoth)}</text>
${codePanel(panelX, PANEL_Y, variant)}
  <rect x="${PAD_X + title.left}" y="${dashY}" width="${title.width}" height="${TITLE_DASH_H}" fill="${ACCENT}"/>
  <text x="${PAD_X}" y="${titleY}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${variant.fg}" stroke="${variant.bg}" stroke-width="${TITLE_HALO}" paint-order="stroke">${escapeXml(label)}</text>
</svg>`;
}

export async function placeholderPng(
	name: string,
	kind: string,
	variant: Variant,
): Promise<Buffer> {
	const label = await fitLabel(name);
	const size = TITLE_SIZE;
	const [nick, title] = await Promise.all([
		measureTextWidth(NICKNAME, EYEBROW_SIZE, {
			letterSpacing: EYEBROW_SPACING,
			weight: 400,
		}),
		measureTextWidth(label, size),
	]);

	return sharp(
		Buffer.from(placeholderSvg(kind, variant, { nick, title, label, size })),
	)
		.png()
		.toBuffer();
}

export interface ThemedPlaceholder {
	light: ProcessedImage;
	dark: ProcessedImage;
}

async function renderVariant(
	name: string,
	kind: string,
	slug: string,
	stem: string,
	variant: Variant,
): Promise<ProcessedImage> {
	const png = await placeholderPng(name, kind, variant);

	return saveImage({
		buffer: png,
		mimeType: "image/png",
		kind: "banner",
		slug,
		stem,
	});
}

export async function createPlaceholder(
	name: string,
	slug: string,
	kind: string,
): Promise<ThemedPlaceholder> {
	const hex = randomBytes(RANDOM_BYTES).toString("hex");
	const [light, dark] = await Promise.all([
		renderVariant(name, kind, slug, `${slug}-${hex}.light`, LIGHT),
		renderVariant(name, kind, slug, `${slug}-${hex}.dark`, DARK),
	]);
	return { light, dark };
}

export function createProjectPlaceholder(
	name: string,
	slug: string,
): Promise<ThemedPlaceholder> {
	return createPlaceholder(name, slug, "проект");
}
