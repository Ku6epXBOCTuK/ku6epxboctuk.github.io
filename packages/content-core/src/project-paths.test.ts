// @vitest-environment node

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
	classifyProjectPath,
	projectPathProblems,
	resolveProjectPath,
} from "./project-paths.ts";

const root = fs.mkdtempSync(join(tmpdir(), "project-paths-"));

function makeRepo(relative: string): string {
	const dir = join(root, relative);
	fs.mkdirSync(join(dir, ".git"), { recursive: true });
	return dir;
}

function makePlainDir(relative: string): string {
	const dir = join(root, relative);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

describe("пути локальных клонов", () => {
	afterAll(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	describe("resolveProjectPath", () => {
		it("пустое значение — null", () => {
			expect(resolveProjectPath(undefined, root)).toBeNull();
			expect(resolveProjectPath("", root)).toBeNull();
			expect(resolveProjectPath("   ", root)).toBeNull();
		});

		it("относительный путь резолвится от корня сайта", () => {
			expect(resolveProjectPath("../example-repo", root)).toBe(
				join(root, "..", "example-repo"),
			);
		});

		it("абсолютный путь оставляем как есть", () => {
			const absolute = join(root, "clone");
			expect(resolveProjectPath(absolute, root)).toBe(absolute);
		});

		it("лишние пробелы обрезаются", () => {
			expect(resolveProjectPath("  ../example-repo  ", root)).toBe(
				join(root, "..", "example-repo"),
			);
		});
	});

	describe("classifyProjectPath", () => {
		it("путь не задан", () => {
			expect(classifyProjectPath(undefined, root)).toEqual({
				declared: null,
				resolved: null,
				state: "not-set",
			});
		});

		it("папки нет — missing, резолв сохраняем для подсказки", () => {
			const verdict = classifyProjectPath("../нет-такого", root);
			expect(verdict.state).toBe("missing");
			expect(verdict.declared).toBe("../нет-такого");
			expect(verdict.resolved).toBe(join(root, "..", "нет-такого"));
		});

		it("папка есть, но это не git-репозиторий", () => {
			makePlainDir("not-a-repo");
			expect(classifyProjectPath("./not-a-repo", root).state).toBe(
				"not-a-repo",
			);
		});

		it("git-репозиторий — ok", () => {
			makeRepo("example-repo");
			const verdict = classifyProjectPath("./example-repo", root);
			expect(verdict.state).toBe("ok");
			expect(verdict.resolved).toBe(join(root, "example-repo"));
		});

		it(".git файлом (worktree) тоже считается репозиторием", () => {
			const dir = join(root, "worktree");
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(join(dir, ".git"), "gitdir: elsewhere\n");
			expect(classifyProjectPath("./worktree", root).state).toBe("ok");
		});

		it("абсолютный путь проверяется так же", () => {
			const dir = makeRepo("abs-clone");
			expect(classifyProjectPath(dir, root).state).toBe("ok");
		});

		it("папка исчезла после успешной проверки — снова missing", () => {
			const dir = makeRepo("transient");
			expect(classifyProjectPath("./transient", root).state).toBe("ok");
			fs.rmSync(join(dir, ".git"), { recursive: true });
			fs.rmdirSync(dir);
			expect(classifyProjectPath("./transient", root).state).toBe("missing");
		});
	});

	describe("projectPathProblems", () => {
		it("в репозитории без проектов проблем нет", () => {
			expect(projectPathProblems({ base: root })).toEqual([]);
		});
	});
});
