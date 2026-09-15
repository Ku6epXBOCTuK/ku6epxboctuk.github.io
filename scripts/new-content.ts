import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import { stdin as rlInput, stdout as rlOutput } from "node:process";
import * as yaml from "js-yaml";

type ContentType = "post" | "article";

const CONTENT_FOLDERS: Record<ContentType, string> = {
	post: "src/content/posts",
	article: "src/content/articles",
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface ContentOptions {
	title: string;
	tags: string[];
	link?: string;
	image?: string;
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function titleFromSlug(slug: string): string {
	const words = slug.split("-");
	return words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function yamlStr(value: string): string {
	return /[:#[\]{},&*!|>'"%@`]/.test(value) ? JSON.stringify(value) : value;
}

function buildContent(
	type: ContentType,
	options: ContentOptions,
	lang: "ru" | "en",
): string {
	const lines: string[] = ["---"];
	lines.push(`title: ${yamlStr(options.title)}`);
	lines.push(`date: ${today()}`);

	if (options.tags.length > 0) {
		lines.push("tags:");
		for (const tag of options.tags) {
			lines.push(`  - ${yamlStr(tag)}`);
		}
	}

	if (options.image) lines.push(`image: ${yamlStr(options.image)}`);
	if (type === "post" && options.link) {
		lines.push(`link: ${yamlStr(options.link)}`);
	}

	if (lang === "en") {
		lines.push("needs_translation: true");
	}

	lines.push("---");

	if (type === "article") {
		lines.push(
			"",
			lang === "ru"
				? "Вступление — короткая версия статьи."
				: "перевод в работе.",
			"",
			"<!--more-->",
			"",
			lang === "ru"
				? "Полный текст статьи: разделы, картинки, код..."
				: "перевод в работе.",
		);
	} else {
		lines.push("", lang === "ru" ? "Текст поста." : "перевод в работе.");
	}

	return lines.join("\n") + "\n";
}

function writeFile(filePath: string, content: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, "utf8");
}

function validateSlug(slug: string): boolean {
	return SLUG_RE.test(slug);
}

function collectTags(raw: string): string[] {
	return raw
		? raw
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0)
		: [];
}

async function promptContent(
	rl: readline.Interface,
	type: ContentType,
	slug: string,
): Promise<ContentOptions> {
	const defaultTitle = titleFromSlug(slug);
	const title = (await rl.question(`Заголовок (${defaultTitle}): `)).trim();
	const tagsRaw = (await rl.question("Теги (через запятую): ")).trim();
	const link =
		type === "post"
			? (await rl.question("Ссылка (link, опционально): ")).trim() || undefined
			: undefined;
	const image =
		(await rl.question("Картинка (image, опционально): ")).trim() || undefined;

	return {
		title: title || defaultTitle,
		tags: collectTags(tagsRaw),
		link,
		image,
	};
}

async function createPair(
	type: ContentType,
	slug: string,
	options: ContentOptions,
): Promise<void> {
	const folder = path.join(CONTENT_FOLDERS[type], slug);
	if (fs.existsSync(folder)) {
		console.error(
			`Папка уже существует: ${folder}. Используйте "npm run sync ${type} ${slug}", чтобы добавить перевод.`,
		);
		process.exit(1);
	}

	writeFile(
		path.join(folder, "index.ru.md"),
		buildContent(type, options, "ru"),
	);
	writeFile(
		path.join(folder, "index.en.md"),
		buildContent(type, options, "en"),
	);

	console.log(`Создан: ${path.join(folder, "index.ru.md")}`);
	console.log(`Создан: ${path.join(folder, "index.en.md")}`);
}

async function runSync(typeArg: string, slug: string): Promise<void> {
	if (typeArg !== "post" && typeArg !== "article") {
		console.error('Для "--sync" нужен тип: npm run new article <slug> --sync');
		process.exit(1);
	}

	const type = typeArg as ContentType;
	if (!slug) {
		console.error(`Для "--sync" нужен slug: npm run new ${type} <slug> --sync`);
		process.exit(1);
	}

	const folder = path.join(CONTENT_FOLDERS[type], slug);
	const ruPath = path.join(folder, "index.ru.md");
	const enPath = path.join(folder, "index.en.md");

	if (!fs.existsSync(ruPath)) {
		console.error(`Основная версия не найдена: ${ruPath}`);
		process.exit(1);
	}

	if (fs.existsSync(enPath)) {
		console.log(`Перевод уже существует: ${enPath}`);
		return;
	}

	let title = titleFromSlug(slug);
	const ruRaw = fs.readFileSync(ruPath, "utf8");
	const fmMatch = ruRaw.match(/^---\n([\s\S]*?)\n---/);
	if (fmMatch) {
		try {
			const fm = yaml.load(fmMatch[1]) as Record<string, unknown>;
			if (typeof fm.title === "string" && fm.title) {
				title = fm.title;
			}
		} catch {
			// оставляем title из slug
		}
	}

	writeFile(enPath, buildContent(type, { title, tags: [] }, "en"));
	console.log(`Создан: ${enPath}`);
}

async function main(): Promise<void> {
	const rawArgv = process.argv.slice(2);
	const argv =
		(rawArgv[0]?.endsWith(".ts") ?? false) ? rawArgv.slice(1) : rawArgv;
	const syncMode = argv.includes("--sync");
	const args = argv.filter((arg) => !arg.startsWith("--"));
	const argType = (args[0] ?? "") as ContentType | "";
	const argSlug = args[1] ?? "";

	if (syncMode) {
		await runSync(argType, argSlug);
		return;
	}

	let type = argType;
	let slug = argSlug;
	let isInteractive = false;

	if (type !== "post" && type !== "article") {
		isInteractive = true;
	}

	if (!slug) {
		isInteractive = true;
	}

	if (isInteractive) {
		const rl = readline.createInterface({ input: rlInput, output: rlOutput });

		if (type !== "post" && type !== "article") {
			const answer = (
				await rl.question("Тип контента (post/article): ")
			).trim();
			type = (answer || "post") as ContentType;
		}

		if (!slug) {
			slug = (await rl.question("Slug (a-z0-9 и дефисы): ")).trim();
		}

		rl.close();

		if (type !== "post" && type !== "article") {
			console.error("Поддерживаются только post и article.");
			process.exit(1);
		}

		if (!validateSlug(slug)) {
			console.error(
				`Некорректный slug "${slug}": только a-z0-9 и дефисы (slug-example).`,
			);
			process.exit(1);
		}

		const rl2 = readline.createInterface({ input: rlInput, output: rlOutput });
		const options = await promptContent(rl2, type, slug);
		rl2.close();

		await createPair(type, slug, options);
		return;
	}

	if (!validateSlug(slug)) {
		console.error(
			`Некорректный slug "${slug}": только a-z0-9 и дефисы (slug-example).`,
		);
		process.exit(1);
	}

	if (type !== "post" && type !== "article") {
		console.error("Поддерживаются только post и article.");
		process.exit(1);
	}

	await createPair(type, slug, { title: titleFromSlug(slug), tags: [] });
}

void main();
