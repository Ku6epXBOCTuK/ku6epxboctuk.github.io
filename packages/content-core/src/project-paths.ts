import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { listEntries, loadEntry } from "./entries.ts";
import { repoRoot } from "./paths.ts";
import type { ProjectPathReport } from "./types.ts";

/**
 * The clone path lives in the gitignored `<type>s.local.json`, relative to the
 * site root, so no user directory or disk structure reaches git.
 */
export function resolveProjectPath(
	declared: string | undefined,
	base = repoRoot(),
): string | null {
	const value = declared?.trim();
	if (!value) return null;
	return isAbsolute(value) ? value : resolve(base, value);
}

export function classifyProjectPath(
	declared: string | undefined,
	base = repoRoot(),
): Pick<ProjectPathReport, "declared" | "resolved" | "state"> {
	const value = declared?.trim() ? declared.trim() : null;
	if (!value) {
		return { declared: null, resolved: null, state: "not-set" };
	}

	const resolved = resolveProjectPath(value, base);

	if (!existsSync(resolved as string)) {
		return { declared: value, resolved, state: "missing" };
	}

	// NOTE: worktrees and submodules keep `.git` as a file, and existsSync catches both.
	if (!existsSync(join(resolved as string, ".git"))) {
		return { declared: value, resolved, state: "not-a-repo" };
	}

	return { declared: value, resolved, state: "ok" };
}

export interface CheckOptions {
	base?: string;
}

/** Every project, not only broken ones, so the form knows the current status. */
export function checkProjectPaths(
	options: CheckOptions = {},
): ProjectPathReport[] {
	const base = options.base ?? repoRoot();

	return listEntries("project").map((summary) => {
		const entry = loadEntry("project", summary.slug);
		const declared = entry?.local.path;

		return {
			slug: summary.slug,
			title: summary.title,
			...classifyProjectPath(
				typeof declared === "string" ? declared : undefined,
				base,
			),
		};
	});
}

/** Projects weekly cannot work with; a missing path is not a failure, it may simply not be cloned. */
export function projectPathProblems(
	options: CheckOptions = {},
): ProjectPathReport[] {
	return checkProjectPaths(options).filter(
		(report) => report.state === "missing" || report.state === "not-a-repo",
	);
}
