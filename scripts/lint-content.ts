import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

interface FmField {
	name: string;
	type: string;
	required?: boolean;
}

interface ContentType {
	name: string;
	fields: FmField[];
}

const CONTENT_DIRS: Record<string, string> = {
	articles: "src/content/articles",
	posts: "src/content/posts",
	projects: "src/content/projects",
	weekly: "src/content/weekly",
};

const CONTENT_SCHEMAS: Record<string, string> = {
	articles: "article",
	posts: "post",
	projects: "project",
	weekly: "weekly",
};

const MANUAL_TYPES = new Set(["articles", "posts"]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LANG_FILE = /^index\.(ru|en)\.md$/;

let errors = 0;
let warnings = 0;

function fail(message: string): void {
	console.error(message);
	errors++;
}

function warn(message: string): void {
	console.warn(message);
	warnings++;
}

function parseFrontmatter(content: string): {
	data: Record<string, unknown>;
	body: string;
	error: string | null;
} {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return { data: {}, body: content, error: null };
	const body = content.slice(match[0].length);
	try {
		const data = (yaml.load(match[1]) as Record<string, unknown>) || {};
		return { data, body, error: null };
	} catch (e) {
		return {
			data: {},
			body,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

function checkFieldType(value: unknown, expected: string): string | null {
	if (value == null) return null;

	switch (expected) {
		case "string":
		case "datetime":
		case "image":
			if (typeof value !== "string") {
				return `must be a string, got ${Array.isArray(value) ? "array" : typeof value}`;
			}
			break;
		case "boolean":
			if (typeof value !== "boolean") {
				return `must be a boolean, got ${typeof value}`;
			}
			break;
	}

	return null;
}

function lintFile(
	type: string,
	schema: ContentType | undefined,
	directory: string,
	file: string,
	lang: "ru" | "en",
): void {
	const filePath = path.join(directory, file);
	const raw = fs.readFileSync(filePath, "utf8");
	const parsed = parseFrontmatter(raw);
	const { data, body } = parsed;

	if (parsed.error) {
		fail(`${filePath}: could not parse frontmatter: ${parsed.error}`);
		return;
	}

	if ("lang" in data) {
		fail(
			`${filePath}: field "lang" is not allowed (language comes from file name)`,
		);
	}

	if (schema) {
		for (const field of schema.fields) {
			const val = data[field.name];

			if (field.required && (val == null || val === "")) {
				fail(`${filePath}: missing required field "${field.name}"`);
				continue;
			}

			if (val != null) {
				const err = checkFieldType(val, field.type);
				if (err) {
					fail(`${filePath}: field "${field.name}" ${err}`);
				}
			}
		}
	}

	if (typeof data.date === "string" && !ISO_DATE.test(data.date)) {
		fail(
			`${filePath}: field "date" must be ISO YYYY-MM-DD, got "${data.date}"`,
		);
	}

	if (data.tags !== undefined) {
		if (!Array.isArray(data.tags)) {
			fail(`${filePath}: field "tags" must be an array`);
		} else {
			for (const tag of data.tags) {
				if (typeof tag !== "string") {
					fail(`${filePath}: field "tags" items must be strings`);
					break;
				}
			}
		}
	}

	if (type === "articles" && !body.includes("<!--more-->")) {
		fail(`${filePath}: article must contain "<!--more-->" marker in body`);
	}

	if (type === "posts" && body.includes("<!--more-->")) {
		warn(
			`${filePath}: "<!--more-->" is not used in posts (whole body goes to feed)`,
		);
	}

	if (type === "weekly" && data.generated !== true) {
		fail(`${filePath}: field "generated" must be true for weekly reports`);
	}

	if (type === "projects") {
		if ("type" in data) {
			fail(`${filePath}: field "type" is removed for projects (use tags)`);
		}
		if ("url" in data) {
			fail(`${filePath}: field "url" is renamed to "repo"`);
		}
	}

	if (MANUAL_TYPES.has(type) && "excerpt" in data) {
		fail(
			`${filePath}: field "excerpt" is not used for ${type.slice(0, -1)} (teaser is taken from body)`,
		);
	}

	if (lang === "ru" && "needs_translation" in data) {
		fail(
			`${filePath}: field "needs_translation" is only allowed in index.en.md`,
		);
	}
}

function main(): void {
	const fmConfig = JSON.parse(fs.readFileSync("frontmatter.json", "utf8"));
	const contentTypes: ContentType[] =
		fmConfig["frontMatter.taxonomy.contentTypes"] || [];
	const typeMap = new Map(contentTypes.map((ct) => [ct.name, ct]));

	for (const [type, dir] of Object.entries(CONTENT_DIRS)) {
		const fullDir = path.resolve(dir);
		if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) {
			continue;
		}

		const schema = typeMap.get(CONTENT_SCHEMAS[type]);
		const units = fs
			.readdirSync(fullDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);

		for (const unit of units) {
			const unitDir = path.join(dir, unit);
			const files = fs.readdirSync(unitDir).filter((f) => f.endsWith(".md"));

			if (files.length === 0) {
				fail(`[${type}] ${unit}: no index.*.md file found`);
				continue;
			}

			if (!files.includes("index.ru.md")) {
				fail(`[${type}] ${unit}: missing index.ru.md`);
			}

			if (MANUAL_TYPES.has(type) && !files.includes("index.en.md")) {
				warn(`[${type}] ${unit}: missing index.en.md`);
			}

			for (const file of files) {
				const match = LANG_FILE.exec(file);
				if (!match) {
					warn(
						`[${type}] ${unit}: unexpected file "${file}" (expected index.ru.md / index.en.md)`,
					);
					continue;
				}
				lintFile(type, schema, unitDir, file, match[1] as "ru" | "en");
			}
		}
	}

	if (errors > 0) {
		console.error(`\n${errors} error(s), ${warnings} warning(s).`);
		process.exit(1);
	}

	console.log(`All content files are valid (${warnings} warning(s)).`);
}

main();
