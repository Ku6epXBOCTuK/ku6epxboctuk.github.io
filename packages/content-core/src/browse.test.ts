// @vitest-environment node

import * as fs from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { browseRoots, dirOf, listDirs } from "./browse.ts";

/*
 * Обзор папок — единственное место, где редактор смотрит в файловую систему
 * шире, чем в `src/content`. Ошибка здесь выглядит как «в списке пусто» или,
 * что хуже, как обход вверх за пределы диска, поэтому проверяется и то, и
 * другое.
 */

describe("обзор папок", () => {
	const roots: string[] = [];

	function fixture(): string {
		const base = fs.mkdtempSync(`${process.env.TEMP ?? "."}/browse-`);
		roots.push(base);
		return base;
	}

	function dir(base: string, ...parts: string[]): string {
		const path = join(base, ...parts);
		fs.mkdirSync(path, { recursive: true });
		return path;
	}

	afterAll(() => {
		for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
	});

	it("перечисляет подкаталоги и помечает репозитории", () => {
		const base = fixture();
		dir(base, "example-repo");
		dir(base, "web-site");
		fs.writeFileSync(join(base, "notes.txt"), "не папка");
		// worktree и submodule хранят `.git` файлом, а не папкой.
		fs.writeFileSync(
			join(dir(base, "example-repo"), ".git"),
			"gitdir: ../.git/x",
		);

		const { dirs, path, parent } = listDirs(base);

		// Путь нормализуется: разделители приводятся к одному виду, иначе в
		// поле уехало бы то, что на диске, и сравнение с сохранённым не сошлось бы.
		expect(path).toBe(resolve(base));
		expect(dirs.map((d) => d.name)).toEqual(["example-repo", "web-site"]);
		expect(dirs.find((d) => d.name === "example-repo")?.isRepo).toBe(true);
		expect(dirs.find((d) => d.name === "web-site")?.isRepo).toBe(false);
		expect(parent).toBe(dirname(resolve(base)));
	});

	it("отдаёт готовый путь: форма не склеивает его сама", () => {
		const base = fixture();
		dir(base, "nested");

		const entry = listDirs(base).dirs[0];

		expect(entry?.full).toBe(resolve(base, "nested"));
	});

	it("прячет скрытые и служебные папки", () => {
		const base = fixture();
		dir(base, ".git");
		dir(base, ".cache");
		dir(base, "node_modules");
		dir(base, "project");

		expect(listDirs(base).dirs.map((d) => d.name)).toEqual(["project"]);
	});

	it("не падает на отсутствующей папке, а отдаёт пустой список", () => {
		const base = fixture();
		const missing = join(base, "нет-такой");

		const listing = listDirs(missing);

		expect(listing.dirs).toEqual([]);
		// Подняться из несуществующей папки всё равно можно, иначе обзор
		// застревает.
		expect(listing.parent).toBeTypeOf("string");
	});

	it("не падает, когда папка есть, а читать её нельзя", () => {
		const base = fixture();
		const locked = dir(base, "locked");
		fs.chmodSync(locked, 0o000);

		try {
			// Под рукой Windows права не работают, и проверка молча теряет смысл:
			// пропускаем, а не пишем тест, который врёт.
			if (process.platform === "win32") return;
			expect(listDirs(locked).dirs).toEqual([]);
		} finally {
			fs.chmodSync(locked, 0o755);
		}
	});

	it("пустое значение открывает обзор с корня сайта", () => {
		const base = fixture();

		expect(dirOf(undefined, base)).toBe(resolve(base));
		expect(dirOf("   ", base)).toBe(resolve(base));
	});

	it("относительный путь разрешается от корня сайта", () => {
		const base = fixture();

		expect(dirOf("../example-repo", base)).toBe(
			resolve(base, "../example-repo"),
		);
	});

	it("абсолютный путь остаётся собой", () => {
		const base = fixture();
		const absolute = dir(base, "target");

		expect(dirOf(absolute, "C:\\совсем\\другое\\место")).toBe(absolute);
	});

	it("предлагает родителя и выше, но не корень диска", () => {
		const out = browseRoots(fixture());

		expect(out.length).toBeGreaterThan(0);
		for (const root of out) expect(root).not.toBe(parse(out[0]).root);
	});
});
