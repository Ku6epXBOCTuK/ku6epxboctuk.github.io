import * as prettier from "prettier";

// NOTE: content units stay on Prettier because Biome's markdown formatter
// rewrites frontmatter YAML, and the content loader parses it as YAML.
const OPTIONS = {
	parser: "markdown",
	useTabs: false,
	printWidth: 80,
	proseWrap: "always",
	endOfLine: "lf",
} satisfies prettier.Options;

export async function formatUnit(raw: string): Promise<string> {
	return prettier.format(raw, OPTIONS);
}

export async function isFormatted(raw: string): Promise<boolean> {
	return prettier.check(raw, OPTIONS);
}
