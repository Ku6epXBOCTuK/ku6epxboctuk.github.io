// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { basename, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { contentDir, localFile, metaFile, unitDir, unitFile } from "./paths.ts";

const rel = (file: string): string => relative("C:", file).replaceAll(sep, "/");

describe("content paths", () => {
	// NOTE: file names are a contract with disk: .gitignore, the migration script
	// and the site reference them, so they are pinned literally here.
	it("shared file names", () => {
		expect(rel(metaFile("post"))).toBe("src/content/posts.json");
		expect(rel(metaFile("article"))).toBe("src/content/articles.json");
		expect(rel(metaFile("project"))).toBe("src/content/projects.json");
		expect(rel(metaFile("weekly"))).toBe("src/content/weekly.json");
	});

	it("local file names", () => {
		expect(rel(localFile("project"))).toBe("src/content/projects.local.json");
		expect(rel(localFile("post"))).toBe("src/content/posts.local.json");
		expect(rel(localFile("weekly"))).toBe("src/content/weekly.local.json");
	});

	it("language files stayed put", () => {
		expect(rel(unitFile("project", "example-repo", "ru"))).toBe(
			"src/content/projects/example-repo/index.ru.md",
		);
		expect(rel(unitFile("project", "example-repo", "en"))).toBe(
			"src/content/projects/example-repo/index.en.md",
		);
		expect(rel(unitDir("post", "hello"))).toBe("src/content/posts/hello");
	});

	it("the weekly folder exists even though the editor does not edit it", () => {
		expect(rel(contentDir("weekly"))).toBe("src/content/weekly");
	});

	it("shared files are not inside the type folder", () => {
		expect(basename(contentDir("project"))).toBe("projects");
		expect(basename(metaFile("project"))).not.toBe("projects");
	});
});
