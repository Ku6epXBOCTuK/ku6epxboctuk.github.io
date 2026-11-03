import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	isFormatted,
	repoRoot,
	validateContent,
} from "@ku6epxboctuk/content-core";

const root = repoRoot();
const contentDir = join(root, "src", "content");

const { errors, warnings } = validateContent(root);

const units = readdirSync(contentDir, { recursive: true }).filter(
	(file): file is string =>
		typeof file === "string" && /index\.(ru|en)\.md$/.test(file),
);

for (const unit of units) {
	const path = join(contentDir, unit);
	const raw = readFileSync(path, "utf8");
	if (!(await isFormatted(raw))) {
		errors.push(`${relative(root, path)}: not formatted by the editor`);
	}
}

for (const message of errors) console.error(message);
for (const message of warnings) console.warn(message);

if (errors.length > 0) {
	console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
	process.exit(1);
}

console.log(
	`All content files are valid (${warnings.length} warning(s), ${units.length} unit(s) checked).`,
);
