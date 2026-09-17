import * as fs from "node:fs";
import * as yaml from "js-yaml";

const TEMPLATES_PATH = "scripts/templates.json";

const CONTENT_DIRS: Record<string, string> = {
	articles: "src/content/articles",
	posts: "src/content/posts",
	projects: "src/content/projects",
	weekly: "src/content/weekly",
};

const RUSSIAN_INDEX = /^index\.ru\.md$/;

interface Frontmatter {
	[key: string]: unknown;
}

interface PostMeta {
	type: string;
	slug: string;
	title: string;
	date: string;
	filePath: string;
	socialText: string;
}

interface Template {
	template: string;
	url: string | null;
}

function detectType(filePath: string): string | null {
	for (const [type, dir] of Object.entries(CONTENT_DIRS)) {
		if (filePath.startsWith(dir + "/")) return type;
	}
	return null;
}

function slugFromPath(filePath: string): string {
	const parent = filePath.slice(0, filePath.lastIndexOf("/"));
	return parent.slice(parent.lastIndexOf("/") + 1);
}

function parseFrontmatter(content: string): {
	data: Frontmatter;
	body: string;
} {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return { data: {}, body: content };

	try {
		const data = (yaml.load(match[1]) as Frontmatter) || {};
		return { data, body: content.slice(match[0].length).trim() };
	} catch {
		return { data: {}, body: content.slice(match[0].length).trim() };
	}
}

function teaserFromBody(body: string): string {
	const moreIdx = body.indexOf("<!--more-->");
	return (moreIdx === -1 ? body : body.slice(0, moreIdx)).trim();
}

function resolveExcerpt(type: string, data: Frontmatter, body: string): string {
	if (type === "projects") {
		return typeof data.description === "string" && data.description
			? data.description
			: teaserFromBody(body);
	}
	if (type === "weekly") {
		return typeof data.excerpt === "string" && data.excerpt
			? data.excerpt
			: teaserFromBody(body);
	}
	return teaserFromBody(body);
}

function stringifyValues(data: Frontmatter): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, val] of Object.entries(data)) {
		if (val == null) continue;
		if (typeof val === "string") out[key] = val;
		else if (typeof val === "boolean" || typeof val === "number") {
			out[key] = String(val);
		} else if (Array.isArray(val)) {
			out[key] = val.map(String).join(", ");
		}
	}
	return out;
}

function applyTemplate(template: string, vars: Record<string, string>): string {
	let result = template;
	for (const [key, val] of Object.entries(vars)) {
		result = result.replaceAll(`{${key}}`, val ?? "");
	}
	return result;
}

function resolveUrl(
	type: string,
	data: Frontmatter,
	slug: string,
	template: Template,
): string {
	const vars = { slug, ...stringifyValues(data) };

	if (type === "projects") {
		if (typeof data.homepage === "string" && data.homepage) {
			return data.homepage;
		}
		if (typeof data.repo === "string" && data.repo) return data.repo;
	}

	return template.url ? applyTemplate(template.url, vars) : "";
}

function main(): void {
	// Input: space-separated file paths from FILES env var
	// Note: paths with spaces will break — currently none exist in content dirs
	const filesRaw = process.env.FILES || "";
	const mdFiles = filesRaw
		.split(" ")
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && s !== "null" && s.endsWith(".md"));

	const ruFiles = [...new Set(mdFiles)].filter(
		(f) =>
			detectType(f) !== null && RUSSIAN_INDEX.test(f.split("/").pop() ?? ""),
	);

	if (ruFiles.length === 0) {
		console.log("No content files changed, nothing to do.");
		process.exit(0);
	}

	let templates: Record<string, Template>;
	try {
		templates = JSON.parse(fs.readFileSync(TEMPLATES_PATH, "utf8"));
	} catch {
		console.error(`Templates file not found: ${TEMPLATES_PATH}`);
		process.exit(1);
	}

	const results: PostMeta[] = [];

	for (const filePath of ruFiles) {
		const type = detectType(filePath)!;
		const slug = slugFromPath(filePath);
		const tpl = templates[type];

		if (!tpl) {
			console.warn(`No template for type "${type}", skipping ${filePath}`);
			continue;
		}

		console.log(`Processing [${type}]: ${slug}`);

		const raw = fs.readFileSync(filePath, "utf8");
		const { data, body } = parseFrontmatter(raw);

		if (data.draft === true) {
			console.log(`Skipping draft [${type}]: ${slug}`);
			continue;
		}

		const title =
			typeof data.title === "string" && data.title ? data.title : slug;
		const date = typeof data.date === "string" ? data.date : "";
		const excerpt = resolveExcerpt(type, data, body);
		const url = resolveUrl(type, data, slug, tpl);
		const socialText = applyTemplate(tpl.template, {
			title,
			slug,
			excerpt,
			url,
			...stringifyValues(data),
		});

		results.push({
			type,
			slug,
			title,
			date,
			filePath,
			socialText,
		});
	}

	fs.writeFileSync(".post-meta.json", JSON.stringify(results, null, 2), "utf8");
	console.log(`Prepared ${results.length} item(s).`);
}

main();
