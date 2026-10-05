import { listEntries, loadEntry } from "@ku6epxboctuk/content-core";

const empty: string[] = [];

for (const summary of listEntries("project")) {
	const entry = loadEntry("project", summary.slug);
	if (!entry) continue;
	const ru = entry.versions.ru.frontmatter.description;
	const en = entry.versions.en.frontmatter.description;
	if (!ru && !en) empty.push(summary.slug);
}

if (empty.length === 0) {
	console.log("У всех проектов есть description.");
} else {
	console.log(`Проекты без description (${empty.length}):`);
	for (const slug of empty) console.log(`- ${slug}`);
}
