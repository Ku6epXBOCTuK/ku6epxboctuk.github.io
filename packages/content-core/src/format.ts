import { join } from "node:path";
import * as prettier from "prettier";
import { repoRoot } from "./paths.ts";

// Имя файла нужно, чтобы сработали overrides по `*.md` из prettier.config.js.
const SAMPLE = join(repoRoot(), "src", "content", "posts", "index.ru.md");

let cached: Promise<prettier.Options> | undefined;

async function resolve(): Promise<prettier.Options> {
	const resolved = await prettier.resolveConfig(SAMPLE);
	return { ...(resolved ?? {}), filepath: SAMPLE, parser: "markdown" };
}

function options(): Promise<prettier.Options> {
	cached ??= resolve();
	return cached;
}

export async function formatUnit(raw: string): Promise<string> {
	return prettier.format(raw, await options());
}

export async function isFormatted(raw: string): Promise<boolean> {
	return prettier.check(raw, await options());
}
