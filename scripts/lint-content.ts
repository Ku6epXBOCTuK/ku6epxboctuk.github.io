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
	post: "src/posts",
	project: "src/projects",
	weekly: "src/weekly",
};

function extractFrontmatter(raw: string): Record<string, unknown> {
	const match = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};
	try {
		return (yaml.load(match[1]) as Record<string, unknown>) || {};
	} catch {
		return {};
	}
}

function checkType(
	field: string,
	value: unknown,
	expected: string,
): string | null {
	if (value == null) return null;

	switch (expected) {
		case "string":
		case "datetime":
		case "image":
			if (typeof value !== "string") {
				return `must be a string, got ${Array.isArray(value) ? "array" : typeof value}`;
			}
			break;
		case "tags":
		case "categories":
			if (!Array.isArray(value)) {
				return `must be an array, got ${typeof value}`;
			}
			break;
		case "draft":
			if (typeof value !== "boolean") {
				return `must be a boolean, got ${typeof value}`;
			}
			break;
	}

	return null;
}

function main(): void {
	const fmConfig = JSON.parse(fs.readFileSync("frontmatter.json", "utf8"));
	const contentTypes: ContentType[] =
		fmConfig["frontMatter.taxonomy.contentTypes"] || [];

	const typeMap: Record<string, ContentType> = {};
	for (const ct of contentTypes) {
		typeMap[ct.name] = ct;
	}

	let hasErrors = false;

	for (const [type, dir] of Object.entries(CONTENT_DIRS)) {
		const fullDir = path.resolve(dir);
		if (!fs.existsSync(fullDir)) continue;

		const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".md"));
		const schema = typeMap[type];
		if (!schema) continue;

		for (const file of files) {
			const filePath = path.join(dir, file);
			const raw = fs.readFileSync(filePath, "utf8");
			const fm = extractFrontmatter(raw);

			for (const field of schema.fields) {
				const val = fm[field.name];

				if (field.required) {
					if (val == null || val === "") {
						console.error(
							`[${type}] ${file}: missing required field "${field.name}"`,
						);
						hasErrors = true;
						continue;
					}
				}

				if (val != null) {
					const err = checkType(field.name, val, field.type);
					if (err) {
						console.error(`[${type}] ${file}: field "${field.name}" ${err}`);
						hasErrors = true;
					}
				}
			}
		}
	}

	if (hasErrors) {
		console.error("\nSome content files have issues.");
		process.exit(1);
	}

	console.log("All content files are valid.");
}

main();
