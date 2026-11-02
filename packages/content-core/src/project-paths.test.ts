// NOTE: these tests need the node environment, not a DOM.
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

describe("local clone paths", () => {
	afterAll(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	describe("resolveProjectPath", () => {
		it("an empty value is null", () => {
			expect(resolveProjectPath(undefined, root)).toBeNull();
			expect(resolveProjectPath("", root)).toBeNull();
			expect(resolveProjectPath("   ", root)).toBeNull();
		});

		it("a relative path resolves from the site root", () => {
			expect(resolveProjectPath("../example-repo", root)).toBe(
				join(root, "..", "example-repo"),
			);
		});

		it("an absolute path stays as is", () => {
			const absolute = join(root, "clone");
			expect(resolveProjectPath(absolute, root)).toBe(absolute);
		});

		it("extra spaces are trimmed", () => {
			expect(resolveProjectPath("  ../example-repo  ", root)).toBe(
				join(root, "..", "example-repo"),
			);
		});
	});

	describe("classifyProjectPath", () => {
		it("path is not set", () => {
			expect(classifyProjectPath(undefined, root)).toEqual({
				declared: null,
				resolved: null,
				state: "not-set",
			});
		});

		it("no folder is missing, but the resolution is kept for the hint", () => {
			const verdict = classifyProjectPath("../нет-такого", root);
			expect(verdict.state).toBe("missing");
			expect(verdict.declared).toBe("../нет-такого");
			expect(verdict.resolved).toBe(join(root, "..", "нет-такого"));
		});

		it("the folder exists but is not a git repository", () => {
			makePlainDir("not-a-repo");
			expect(classifyProjectPath("./not-a-repo", root).state).toBe(
				"not-a-repo",
			);
		});

		it("a git repository is ok", () => {
			makeRepo("example-repo");
			const verdict = classifyProjectPath("./example-repo", root);
			expect(verdict.state).toBe("ok");
			expect(verdict.resolved).toBe(join(root, "example-repo"));
		});

		it(".git as a file (worktree) also counts as a repository", () => {
			const dir = join(root, "worktree");
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(join(dir, ".git"), "gitdir: elsewhere\n");
			expect(classifyProjectPath("./worktree", root).state).toBe("ok");
		});

		it("an absolute path is checked the same way", () => {
			const dir = makeRepo("abs-clone");
			expect(classifyProjectPath(dir, root).state).toBe("ok");
		});

		it("a folder gone after a successful check is missing again", () => {
			const dir = makeRepo("transient");
			expect(classifyProjectPath("./transient", root).state).toBe("ok");
			fs.rmSync(join(dir, ".git"), { recursive: true });
			fs.rmdirSync(dir);
			expect(classifyProjectPath("./transient", root).state).toBe("missing");
		});
	});

	describe("projectPathProblems", () => {
		it("a repository without projects has no problems", () => {
			expect(projectPathProblems({ base: root })).toEqual([]);
		});
	});
});
