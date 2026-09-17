import * as fs from "node:fs";
import * as path from "node:path";
import { stdin as rlInput, stdout as rlOutput } from "node:process";
import * as readline from "node:readline/promises";
import * as yaml from "js-yaml";

type ContentType = "post" | "article";

const CONTENT_FOLDERS: Record<ContentType, string> = {
	post: "src/content/posts",
	article: "src/content/articles",
};

const PROJECTS_DIR = "src/content/projects";
const MANIFEST_PATH = "projects.yaml";
const MANIFEST_SCHEMA_LINE =
	"# yaml-language-server: $schema=./projects.schema.json";

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
		console.error(`Папка уже существует: ${folder}.`);
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

interface GitHubRepo {
	name: string;
	description: string | null;
	language: string | null;
	topics?: string[];
	homepage: string | null;
}

interface ProjectFields {
	title: string;
	subtitle: string | null;
	description: string | null;
	tags: string[];
	repo: string;
	homepage: string | null;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
	const match =
		/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(
			url,
		);
	if (!match) return null;
	return { owner: match[1], repo: match[2] };
}

function slugifyRepoName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function buildProjectContent(fields: ProjectFields, lang: "ru" | "en"): string {
	const lines: string[] = ["---"];
	lines.push(`title: ${yamlStr(fields.title)}`);
	if (fields.subtitle) lines.push(`subtitle: ${yamlStr(fields.subtitle)}`);
	if (fields.description) {
		lines.push(`description: ${yamlStr(fields.description)}`);
	}
	if (fields.tags.length > 0) {
		lines.push("tags:");
		for (const tag of fields.tags) {
			lines.push(`  - ${yamlStr(tag)}`);
		}
	}
	lines.push(`repo: ${yamlStr(fields.repo)}`);
	if (fields.homepage) lines.push(`homepage: ${yamlStr(fields.homepage)}`);
	if (lang === "en") lines.push("needs_translation: true");
	lines.push("status: raw");
	lines.push("---");
	return lines.join("\n") + "\n";
}

function appendManifest(slug: string, repo: string): void {
	const entry = [
		`  - slug: ${slug}`,
		`    repo: ${repo}`,
		`    # path: ../${slug}`,
	].join("\n");

	if (!fs.existsSync(MANIFEST_PATH)) {
		fs.writeFileSync(
			MANIFEST_PATH,
			`${MANIFEST_SCHEMA_LINE}\n\nprojects:\n${entry}\n`,
			"utf8",
		);
		return;
	}

	const text = fs.readFileSync(MANIFEST_PATH, "utf8");
	const data = yaml.load(text) as {
		projects?: Array<{ slug?: string }>;
	} | null;
	if (data?.projects?.some((p) => p.slug === slug)) {
		console.log(`Манифест: запись со slug "${slug}" уже есть — не дублирую.`);
		return;
	}

	const emptyList = /^projects:[ \t]*\[\][ \t]*$/m;
	if (emptyList.test(text)) {
		fs.writeFileSync(
			MANIFEST_PATH,
			text.replace(emptyList, `projects:\n${entry}`),
			"utf8",
		);
		return;
	}

	const pad = text.endsWith("\n") ? "" : "\n";
	fs.writeFileSync(MANIFEST_PATH, `${text}${pad}${entry}\n`, "utf8");
}

async function createProjectFromGitHub(url: string): Promise<boolean> {
	const parsed = parseGitHubUrl(url.trim());
	if (!parsed) {
		console.error(
			`Не похоже на GitHub URL: "${url}". Ожидается https://github.com/{owner}/{repo}.`,
		);
		process.exitCode = 1;
		return false;
	}

	const headers: Record<string, string> = {
		"User-Agent": "ku6epxboctuk-site-new-content",
		Accept: "application/vnd.github+json",
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;

	let res: Response;
	try {
		res = await fetch(
			`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
			{ headers },
		);
	} catch (err) {
		console.error(`GitHub API недоступен: ${(err as Error).message}`);
		process.exitCode = 1;
		return false;
	}

	if (res.status === 404) {
		await res.body?.cancel();
		console.error(
			`Репозиторий не найден (или приватный): ${url}. Приватный репо — не на витрину.`,
		);
		process.exitCode = 1;
		return false;
	}
	if (res.status === 403) {
		await res.body?.cancel();
		console.error(
			"GitHub API: лимит запросов исчерпан (60/час). Задай GITHUB_TOKEN в env.",
		);
		process.exitCode = 1;
		return false;
	}
	if (!res.ok) {
		await res.body?.cancel();
		console.error(`GitHub API: HTTP ${res.status}.`);
		process.exitCode = 1;
		return false;
	}

	const repo = (await res.json()) as GitHubRepo;
	const slug = slugifyRepoName(repo.name);
	if (!slug || !validateSlug(slug)) {
		console.error(`Не удалось получить slug из имени репо: "${repo.name}".`);
		process.exitCode = 1;
		return false;
	}

	const language = repo.language ? repo.language.toLowerCase() : null;
	const topics = (repo.topics ?? []).map((topic) => topic.toLowerCase());
	const subtitleParts = [...(language ? [language] : []), ...topics].slice(
		0,
		4,
	);
	const tags = topics.length > 0 ? topics : language ? [language] : [];
	const description = repo.description?.trim() || "TODO: описание проекта";
	const homepage = repo.homepage?.trim() || null;

	const folder = path.join(PROJECTS_DIR, slug);
	if (fs.existsSync(folder)) {
		console.error(`Папка уже существует: ${folder}.`);
		process.exitCode = 1;
		return false;
	}

	const fields: ProjectFields = {
		title: slug,
		subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
		description,
		tags,
		repo: url.trim(),
		homepage,
	};

	writeFile(
		path.join(folder, "index.ru.md"),
		buildProjectContent(fields, "ru"),
	);
	writeFile(
		path.join(folder, "index.en.md"),
		buildProjectContent(fields, "en"),
	);
	appendManifest(slug, fields.repo);

	console.log(`Создан: ${path.join(folder, "index.ru.md")}`);
	console.log(`Создан: ${path.join(folder, "index.en.md")}`);
	console.log("Манифест: запись дописана (path закомментирован до клона).");
	if (description === "TODO: описание проекта") {
		console.log(
			"⚠ У репо нет description — записан TODO, допиши в index.ru.md.",
		);
	}
	console.log("Дальше руками:");
	console.log("  - описание: обычно английский, перепиши на свой лад");
	console.log("  - проверь subtitle и tags");
	console.log(`  - склонируй репо и раскомментируй path (../${slug})`);
	return true;
}

async function main(): Promise<void> {
	const rawArgv = process.argv.slice(2);
	const argv =
		(rawArgv[0]?.endsWith(".ts") ?? false) ? rawArgv.slice(1) : rawArgv;
	const args = argv.filter((arg) => !arg.startsWith("--"));
	let type = (args[0] ?? "") as ContentType | "project" | "";
	let slug = args[1] ?? "";

	if (type === "project") {
		let url = slug;
		if (!url) {
			const rl = readline.createInterface({
				input: rlInput,
				output: rlOutput,
			});
			url = (await rl.question("GitHub URL: ")).trim();
			rl.close();
		}
		await createProjectFromGitHub(url);
		return;
	}

	const isInteractive = (type !== "post" && type !== "article") || !slug;

	if (isInteractive) {
		const rl = readline.createInterface({ input: rlInput, output: rlOutput });

		if (type !== "post" && type !== "article") {
			const answer = (
				await rl.question("Тип контента (post/article/project): ")
			).trim();
			if (answer === "project") {
				const url = (await rl.question("GitHub URL: ")).trim();
				rl.close();
				await createProjectFromGitHub(url);
				return;
			}
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
