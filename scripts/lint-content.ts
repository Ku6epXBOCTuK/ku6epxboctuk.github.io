import { repoRoot, validateContent } from "@ku6epxboctuk/content-core";

const { errors, warnings } = validateContent(repoRoot());

for (const message of errors) console.error(message);
for (const message of warnings) console.warn(message);

if (errors.length > 0) {
	console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
	process.exit(1);
}

console.log(`All content files are valid (${warnings.length} warning(s)).`);
