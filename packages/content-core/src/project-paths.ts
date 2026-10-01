import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { repoRoot } from "./paths.ts";
import { listUnits, readUnit } from "./repository.ts";
import type { ContentLang, ProjectPathReport } from "./types.ts";

/**
 * Путь к локальному клону лежит в frontmatter проекта, относительно корня
 * сайта: `path: ../brul`. Так в git попадает `../brul`, а не `C:\Users\...`.
 * Абсолютные пути тоже работают, но в репозиторий утекает структура диска,
 * поэтому форма подсказывает относительные.
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

	// worktree и submodule хранят .git файлом, а не папкой — existsSync ловит оба.
	if (!existsSync(join(resolved as string, ".git"))) {
		return { declared: value, resolved, state: "not-a-repo" };
	}

	return { declared: value, resolved, state: "ok" };
}

export interface CheckOptions {
	base?: string;
}

/** Разбор всех проектов: не только проблемные, чтобы форма знала текущий статус. */
export function checkProjectPaths(
	options: CheckOptions = {},
): ProjectPathReport[] {
	const base = options.base ?? repoRoot();

	return listUnits("project").map((summary) => {
		const lang: ContentLang = summary.langs.includes("ru")
			? "ru"
			: (summary.langs[0] ?? "ru");
		const unit = readUnit("project", summary.slug, lang);
		const declared = unit?.frontmatter.path;

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

/** Проекты, с которыми weekly не сможет поработать. Путь не задан — не поломка:
 * часть проектов может просто не быть склонирована. */
export function projectPathProblems(
	options: CheckOptions = {},
): ProjectPathReport[] {
	return checkProjectPaths(options).filter(
		(report) => report.state === "missing" || report.state === "not-a-repo",
	);
}
