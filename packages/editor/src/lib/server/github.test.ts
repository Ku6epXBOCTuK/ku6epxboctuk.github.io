// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	absoluteReadmeUrl,
	firstParagraph,
	humanize,
	inlineText,
	isBadgeUrl,
	parseRepoUrl,
	readmeImageUrls,
	repoUrl,
	slugifyRepoName,
} from "./github.ts";

const RAW = "https://raw.githubusercontent.com/o/r/main";

describe("parseRepoUrl", () => {
	it.each([
		[
			"https://github.com/Ku6epXBOCTuK/example-repo",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"http://github.com/Ku6epXBOCTuK/example-repo",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/example-repo/",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		["github.com/Ku6epXBOCTuK/example-repo", "Ku6epXBOCTuK", "example-repo"],
		[
			"www.github.com/Ku6epXBOCTuK/example-repo",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		["Ku6epXBOCTuK/example-repo", "Ku6epXBOCTuK", "example-repo"],
		[
			"  https://github.com/Ku6epXBOCTuK/example-repo  ",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/example-repo.git",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"git@github.com:Ku6epXBOCTuK/example-repo.git",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"git+https://github.com/Ku6epXBOCTuK/example-repo",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/example-repo/tree/main",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/example-repo?tab=readme",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/example-repo#install",
			"Ku6epXBOCTuK",
			"example-repo",
		],
		[
			"https://github.com/Ku6epXBOCTuK/now_playing",
			"Ku6epXBOCTuK",
			"now_playing",
		],
	])("%s → %s/%s", (input, owner, repo) => {
		expect(parseRepoUrl(input)).toEqual({ owner, repo });
	});

	it.each([
		"",
		"   ",
		"не ссылка",
		"https://gitlab.com/o/r",
		"example-repo",
		"https://github.com/Ku6epXBOCTuK",
		"https://github.com/features/actions",
		"https://github.com/topics/rust",
		"https://github.com/o/r/../../etc",
	])("not a repository link: %s", (input) => {
		expect(parseRepoUrl(input)).toBeNull();
	});

	it("rebuilds the canonical url", () => {
		const ref = parseRepoUrl("github.com/Ku6epXBOCTuK/example-repo/tree/main");
		expect(ref && repoUrl(ref)).toBe(
			"https://github.com/Ku6epXBOCTuK/example-repo",
		);
	});
});

describe("humanize", () => {
	it.each([
		["example-repo", "Example repo"],
		["now-playing", "Now playing"],
		["now_playing", "Now playing"],
		["git.overhooks", "Git overhooks"],
		["a-b-c", "A b c"],
	])("%s → %s", (input, expected) => {
		expect(humanize(input)).toBe(expected);
	});
});

describe("slugifyRepoName", () => {
	it.each([
		["example-repo", "example-repo"],
		["now_playing", "now-playing"],
		["git.overhooks", "git-overhooks"],
		["example-lab", "example-lab"],
		["--weird--name--", "weird-name"],
		["_leading", "leading"],
	])("%s → %s", (input, expected) => {
		expect(slugifyRepoName(input)).toBe(expected);
	});
});

describe("firstParagraph", () => {
	it("skips heading, badges and html, returns the first paragraph", () => {
		const readme = [
			"# example-repo",
			"",
			"[![build](https://img.shields.io/badge/build-passing-green)](https://ci.example)",
			"",
			'<p align="center">',
			'  <img src="logo.svg" width="120">',
			"</p>",
			"",
			"**Быстрый** инструмент для [сжатия](https://example.com) картинок.",
			"Работает везде.",
			"",
			"## Установка",
			"",
			"```sh",
			"npm i -g example-repo",
			"```",
		].join("\n");

		expect(firstParagraph(readme)).toBe(
			"Быстрый инструмент для сжатия картинок. Работает везде.",
		);
	});

	it("skips lists, tables, quotes and code", () => {
		const readme = [
			"- пункт один",
			"- пункт два",
			"",
			"| a | b |",
			"| - | - |",
			"",
			"> цитата",
			"",
			"~~~",
			"код",
			"~~~",
			"",
			"Настоящее описание.",
		].join("\n");

		expect(firstParagraph(readme)).toBe("Настоящее описание.");
	});

	it("an empty README gives an empty string", () => {
		expect(firstParagraph("")).toBe("");
		expect(firstParagraph("# Только заголовок\n")).toBe("");
		expect(firstParagraph("<!-- комментарий -->\n")).toBe("");
	});
	it("handles CRLF as GitHub sends it", () => {
		const readme = [
			"# example-repo",
			"",
			"Декларативный UI для нативных десктоп-приложений на Rust.",
			"Без браузерного движка.",
			"",
			"## Установка",
		].join("\r\n");

		expect(firstParagraph(readme)).toBe(
			"Декларативный UI для нативных десктоп-приложений на Rust. Без браузерного движка.",
		);
	});

	it("turns paragraph line breaks into spaces", () => {
		expect(firstParagraph("Первый.\nВторой.\n")).toBe("Первый. Второй.");
	});
});

describe("inlineText", () => {
	it("strips markup and keeps the text", () => {
		expect(
			inlineText(
				"Смотри [`config.toml`](a) и **жирное**, курсив *вот*, код `npm i`.",
			),
		).toBe("Смотри config.toml и жирное, курсив вот, код npm i.");
	});

	it("drops images entirely", () => {
		expect(inlineText("![alt](x.png) Текст")).toBe("Текст");
	});
});

describe("absoluteReadmeUrl", () => {
	it.each([
		["https://cdn.example/a.png", "https://cdn.example/a.png"],
		["//cdn.example/a.png", "https://cdn.example/a.png"],
		["docs/a.png", `${RAW}/docs/a.png`],
		["./docs/a.png", `${RAW}/docs/a.png`],
		["/docs/a.png", `${RAW}/docs/a.png`],
	])("%s → %s", (src, expected) => {
		expect(absoluteReadmeUrl(RAW, src)).toBe(expected);
	});

	it.each(["", "   ", "data:image/png;base64,AAA"])("not a link: %s", (src) => {
		expect(absoluteReadmeUrl(RAW, src)).toBeNull();
	});
});

describe("isBadgeUrl", () => {
	it.each([
		["https://img.shields.io/badge/build-passing-green", true],
		["https://badgen.net/github/stars/o/r", true],
		["https://codecov.io/gh/o/r/branch/main/graph/badge.svg", true],
		["https://nodei.co/npm/example-repo.png", true],
		["https://raw.githubusercontent.com/o/r/main/docs/shot.png", false],
		["https://github.com/o/r/assets/a.gif", false],
	])("%s → %s", (url, expected) => {
		expect(isBadgeUrl(url)).toBe(expected);
	});
});

describe("readmeImageUrls", () => {
	it("takes markdown and html, drops badges, resolves relative urls", () => {
		const readme = [
			"[![badge](https://img.shields.io/badge/x-y-blue)](https://ci.example)",
			"",
			'<img src="docs/logo.svg" width="80">',
			"",
			"![Скрин](docs/screenshot.png)",
			"",
			'<img src="https://cdn.example/demo.gif">',
			"",
			"![Скрин](docs/screenshot.png)",
		].join("\n");

		expect(readmeImageUrls(readme, RAW)).toEqual([
			`${RAW}/docs/screenshot.png`,
			"https://cdn.example/demo.gif",
		]);
	});

	it("an empty README gives an empty list", () => {
		expect(readmeImageUrls("", RAW)).toEqual([]);
	});

	it("handles CRLF in markup", () => {
		const readme =
			"![Скрин](docs/screenshot.png)\r\n\r\n![Ещё](docs/two.png)\r\n";
		expect(readmeImageUrls(readme, RAW)).toEqual([
			`${RAW}/docs/screenshot.png`,
			`${RAW}/docs/two.png`,
		]);
	});
});
