// @vitest-environment node

import { basename, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { contentDir, localFile, metaFile, unitDir, unitFile } from "./paths.ts";

const rel = (file: string): string => relative("C:", file).replaceAll(sep, "/");

describe("пути контента", () => {
	// Имена файлов — контракт с диском: на них ссылаются .gitignore, скрипт
	// миграции и сайт. Переименование должно быть осознанным, поэтому имена
	// зафиксированы здесь буквально.
	it("имена общих файлов", () => {
		expect(rel(metaFile("post"))).toBe("src/content/posts.json");
		expect(rel(metaFile("article"))).toBe("src/content/articles.json");
		expect(rel(metaFile("project"))).toBe("src/content/projects.json");
		expect(rel(metaFile("weekly"))).toBe("src/content/weekly.json");
	});

	it("имена локальных файлов", () => {
		expect(rel(localFile("project"))).toBe("src/content/projects.local.json");
		expect(rel(localFile("post"))).toBe("src/content/posts.local.json");
		expect(rel(localFile("weekly"))).toBe("src/content/weekly.local.json");
	});

	it("языковые файлы остались на месте", () => {
		expect(rel(unitFile("project", "brul", "ru"))).toBe(
			"src/content/projects/brul/index.ru.md",
		);
		expect(rel(unitFile("project", "brul", "en"))).toBe(
			"src/content/projects/brul/index.en.md",
		);
		expect(rel(unitDir("post", "hello"))).toBe("src/content/posts/hello");
	});

	it("папка weekly существует, хоть редактор её не правит", () => {
		expect(rel(contentDir("weekly"))).toBe("src/content/weekly");
	});

	it("общие файлы не оказались внутри папки типа", () => {
		expect(basename(contentDir("project"))).toBe("projects");
		expect(basename(metaFile("project"))).not.toBe("projects");
	});
});
