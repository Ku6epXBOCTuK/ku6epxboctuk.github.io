/**
 * Разбор ссылки на репозиторий и вытаскивание данных, которые GitHub отдаёт без
 * токена. Сеть трогается только здесь, остальное — чистые функции, их тестируем.
 */
import sharp from "sharp";

const API = "https://api.github.com";
const TIMEOUT_MS = 20_000;
const USER_AGENT = "ku6epxboctuk-editor";

const KB = 1024;
const MAX_IMAGE_MB = 12;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * KB * KB;

/** Ниже этого размера считаем иконкой, а не скриншотом. */
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const MAX_IMAGE_ATTEMPTS = 5;

const NOT_FOUND = 404;
const FORBIDDEN = 403;
const RATE_LIMITED = 429;
const OK = 200;

/** Бейджи и иконки: хостинг сам по себе выдаёт, что картинка не нужна. */
const BADGE_HOSTS = [
	"shields.io",
	"badge.fury.io",
	"badgen.net",
	"travis-ci",
	"travis-ci.org",
	"codecov.io",
	"circleci.com",
	"appveyor.com",
	"nodei.co",
	"npm.im",
	"opencollective.com",
	"repomix",
	"opengraph.githubassets.com",
];

export interface RepoRef {
	owner: string;
	repo: string;
}

export interface RepoMeta {
	name: string;
	fullName: string;
	description: string | null;
	homepage: string | null;
	topics: string[];
	language: string | null;
	archived: boolean;
	defaultBranch: string;
}

const NAME_PATTERN = /^[\w.-]+$/;

const RESERVED_OWNERS = new Set([
	"features",
	"topics",
	"orgs",
	"users",
	"sponsors",
]);

function ownerRepo(path: string): RepoRef | null {
	const match = /^([^/\s?#]+)\/([^/\s?#]+)/.exec(path.replace(/^\/+/, ""));
	if (!match) return null;

	const owner = match[1] as string;
	const repo = match[2] as string;
	if (!NAME_PATTERN.test(owner) || !NAME_PATTERN.test(repo)) return null;
	if (RESERVED_OWNERS.has(owner.toLowerCase())) return null;

	return { owner, repo };
}

/**
 * Понимает всё, чем ссылку на репозиторий обычно пишут: полный url с путём
 * внутри, `owner/repo` без домена и ssh-remote. Чужой домен и `..` отбрасываем:
 * это уже не репозиторий GitHub, а опечатка, которую нечего тащить в проект.
 */
export function parseRepoUrl(input: string): RepoRef | null {
	const raw = input.trim();
	if (!raw || raw.includes("..")) return null;

	const cleaned = raw
		.replace(/^git\+/, "")
		.replace(/^git@github\.com:/i, "https://github.com/")
		.replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
		.replace(/\.git$/i, "");

	const withScheme = /^(?:https?:\/\/)([^/\s?#]+)/i.exec(cleaned);
	if (withScheme) {
		const host = (withScheme[1] as string).toLowerCase().replace(/^www\./, "");
		if (host !== "github.com") return null;
		return ownerRepo(cleaned.slice(withScheme[0].length));
	}

	const hostForm = /^(?:www\.)?github\.com\//i.exec(cleaned);
	if (hostForm) return ownerRepo(cleaned.slice(hostForm[0].length));

	return ownerRepo(cleaned);
}

export function repoUrl(ref: RepoRef): string {
	return `https://github.com/${ref.owner}/${ref.repo}`;
}

export function humanize(name: string): string {
	const words = name.replace(/[._-]+/g, " ").trim();
	if (!words) return name;
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Имя репозитория в slug: `now_playing` → `now-playing`. Подчёркивания и
 * точки в slug не допускаются, а приписывать владельца ко всему — шум.
 */
export function slugifyRepoName(name: string): string {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug;
}

/**
 * GitHub отдаёт README с CRLF, а разделителем блоков у нас `\n\n`. Без
 * нормализации весь файл — один блок, и первый абзац не находится никогда.
 */
export function normalizeMarkdown(markdown: string): string {
	return markdown.replace(/\r\n?/g, "\n");
}

/** README начинается с заголовка, бейджей и html — всё это не описание. */
const SKIP_BLOCK = [
	/^#{1,6}\s/, // заголовок
	/^>/, // цитата
	/^[-*+]\s/, // список
	/^\d+\.\s/, // нумерованный список
	/^\|/, // таблица
	/^!\[/, // картинка
	/^\[!\[/, // бейдж
	/^\[.*\]:/, // ссылка-определение
	/^</, // html
	/^```/, // код
	/^~~~/, // код
	/^---+$/, // разделитель
	/^\*\*\*$/, // разделитель
	/^={3,}$/, // подчёркивание h1
	/^[^\S\n]*$/, // пустое
];

export function firstParagraph(markdown: string): string {
	const blocks = normalizeMarkdown(markdown).split(/\n{2,}/);

	for (const raw of blocks) {
		const block = raw.trim();
		if (!block) continue;
		if (SKIP_BLOCK.some((pattern) => pattern.test(block))) continue;
		// Многострочный html-баннер из нескольких строк
		if (block.includes("<") && block.includes(">")) continue;

		return inlineText(block);
	}

	return "";
}

/**
 * Убирает разметку внутри абзаца, оставляя читаемый текст. Переносы строк
 * склеиваем в пробелы: абзац из README — это мягкая обёртка, а в поле текста
 * проекта его удобнее править одной строкой.
 */
export function inlineText(text: string): string {
	return text
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
		.replace(/<[^>]+>/g, "")
		.replace(/`([^`]*)`/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

export function isBadgeUrl(url: string): boolean {
	return BADGE_HOSTS.some((host) => url.includes(host));
}

/** Относительные картинки README живут в raw по пути от корня репозитория. */
export function absoluteReadmeUrl(rawBase: string, src: string): string | null {
	const trimmed = src.trim();
	if (!trimmed || trimmed.startsWith("data:")) return null;

	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	if (/^\/\//.test(trimmed)) return `https:${trimmed}`;

	const path = trimmed.replace(/^\.?\//, "");
	return `${rawBase}/${path}`;
}

/**
 * Картинки из README по порядку: сначала markdown, потом html. Бейджи выкидываем
 * сразу, остальное отсеется по размеру при скачивании.
 */
export function readmeImageUrls(markdown: string, rawBase: string): string[] {
	const found: string[] = [];

	const push = (src: string) => {
		const url = absoluteReadmeUrl(rawBase, src);
		if (!url || url.startsWith("data:")) return;
		if (isBadgeUrl(url) || url.endsWith(".svg")) return;
		if (!found.includes(url)) found.push(url);
	};

	for (const match of normalizeMarkdown(markdown).matchAll(
		/!\[[^\]]*\]\(\s*([^)\s]+)/g,
	)) {
		push(match[1] as string);
	}
	// Регулярка разбирает чужой README, а не рендерит картинку.
	for (const match of normalizeMarkdown(markdown).matchAll(
		/<img[^>]+src=["']([^"']+)["']/gi, // impeccable-disable-line broken-image
	)) {
		push(match[1] as string);
	}

	return found;
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url, {
		headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": USER_AGENT,
		},
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});

	if (res.status === NOT_FOUND)
		throw new Error("Репозиторий не найден или приватный");
	if (res.status === FORBIDDEN || res.status === RATE_LIMITED) {
		throw new Error(
			"GitHub упёрся в лимит запросов без токена (60 в час). Попробуй позже.",
		);
	}
	if (res.status !== OK) throw new Error(`GitHub ответил ${res.status}`);

	return (await res.json()) as T;
}

interface ApiRepo {
	name: string;
	full_name: string;
	description: string | null;
	homepage: string | null;
	topics?: string[];
	language: string | null;
	archived: boolean;
	default_branch: string;
}

export async function fetchRepoMeta(ref: RepoRef): Promise<RepoMeta> {
	const data = await getJson<ApiRepo>(`${API}/repos/${ref.owner}/${ref.repo}`);
	return {
		name: data.name,
		fullName: data.full_name,
		description: data.description,
		homepage: data.homepage || null,
		topics: data.topics ?? [],
		language: data.language,
		archived: Boolean(data.archived),
		defaultBranch: data.default_branch || "main",
	};
}

export function rawBaseFor(ref: RepoRef, branch: string): string {
	return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}`;
}

/**
 * README может отсутствовать или быть битым — это не ошибка, а пустой текст.
 * Ветку передавать не нужно: `/readme` отдаёт файл ветки по умолчанию.
 */
export async function fetchReadme(ref: RepoRef): Promise<string> {
	const url = `${API}/repos/${ref.owner}/${ref.repo}/readme`;
	const res = await fetch(url, {
		headers: {
			Accept: "application/vnd.github.raw",
			"User-Agent": USER_AGENT,
		},
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (res.status === NOT_FOUND) return "";
	if (res.status !== OK)
		throw new Error(`README: GitHub ответил ${res.status}`);
	return res.text();
}

export interface DownloadedImage {
	buffer: Buffer;
	mimeType: string;
	width: number;
	height: number;
}

/** Скачивает и декодирует. Размер не проверяет — это делает выбор кандидата. */
export async function fetchImage(url: string): Promise<DownloadedImage | null> {
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": USER_AGENT },
			redirect: "follow",
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (!res.ok) return null;

		const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "";
		if (!mimeType.startsWith("image/")) return null;
		if (mimeType === "image/svg+xml") return null;

		const buffer = Buffer.from(await res.arrayBuffer());
		if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;

		const meta = await sharp(buffer, { animated: true }).metadata();
		return {
			buffer,
			mimeType,
			width: meta.width ?? 0,
			// У анимированных gifheight — это высота всех кадров, сложенных
			// в одну полосу. Для решения «подходит ли обложка» нужен кадр.
			height: meta.pageHeight ?? meta.height ?? 0,
		};
	} catch {
		return null;
	}
}

export interface ImageCandidate {
	url: string;
	width: number;
	height: number;
}

export interface PickResult {
	image: DownloadedImage | null;
	/** Что нашли и почему не взяли — нужно для подсказки в интерфейсе. */
	rejected: ImageCandidate[];
}

/**
 * Первая достаточно большая картинка из README: скриншот, а не иконка. Бейджи
 * отсеяны раньше, здесь остаётся только размер. Отклонённые кандидаты
 * возвращаем, чтобы интерфейс мог сказать, чего именно не хватило.
 */
export async function pickReadmeImage(
	urls: string[],
	attempts = MAX_IMAGE_ATTEMPTS,
): Promise<PickResult> {
	const rejected: ImageCandidate[] = [];

	for (const url of urls.slice(0, attempts)) {
		const got = await fetchImage(url);
		if (!got) {
			rejected.push({ url, width: 0, height: 0 });
			continue;
		}
		if (got.width < MIN_WIDTH || got.height < MIN_HEIGHT) {
			rejected.push({ url, width: got.width, height: got.height });
			continue;
		}
		return { image: got, rejected };
	}

	return { image: null, rejected };
}
