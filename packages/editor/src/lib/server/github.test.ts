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
		["https://github.com/Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["http://github.com/Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["https://github.com/Ku6epXBOCTuK/brul/", "Ku6epXBOCTuK", "brul"],
		["github.com/Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["www.github.com/Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["  https://github.com/Ku6epXBOCTuK/brul  ", "Ku6epXBOCTuK", "brul"],
		["https://github.com/Ku6epXBOCTuK/brul.git", "Ku6epXBOCTuK", "brul"],
		["git@github.com:Ku6epXBOCTuK/brul.git", "Ku6epXBOCTuK", "brul"],
		["git+https://github.com/Ku6epXBOCTuK/brul", "Ku6epXBOCTuK", "brul"],
		["https://github.com/Ku6epXBOCTuK/brul/tree/main", "Ku6epXBOCTuK", "brul"],
		["https://github.com/Ku6epXBOCTuK/brul?tab=readme", "Ku6epXBOCTuK", "brul"],
		["https://github.com/Ku6epXBOCTuK/brul#install", "Ku6epXBOCTuK", "brul"],
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
		"brul",
		"https://github.com/Ku6epXBOCTuK",
		"https://github.com/features/actions",
		"https://github.com/topics/rust",
		"https://github.com/o/r/../../etc",
	])("не ссылка на репозиторий: %s", (input) => {
		expect(parseRepoUrl(input)).toBeNull();
	});

	it("собирает обратно канонический url", () => {
		const ref = parseRepoUrl("github.com/Ku6epXBOCTuK/brul/tree/main");
		expect(ref && repoUrl(ref)).toBe("https://github.com/Ku6epXBOCTuK/brul");
	});
});

describe("humanize", () => {
	it.each([
		["brul", "Brul"],
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
		["brul", "brul"],
		["now_playing", "now-playing"],
		["git.overhooks", "git-overhooks"],
		["effect-ts-practice", "effect-ts-practice"],
		["--weird--name--", "weird-name"],
		["_leading", "leading"],
	])("%s → %s", (input, expected) => {
		expect(slugifyRepoName(input)).toBe(expected);
	});
});

describe("firstParagraph", () => {
	it("пропускает заголовок, бейджи и html, отдаёт первый абзац", () => {
		const readme = [
			"# brul",
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
			"npm i -g brul",
			"```",
		].join("\n");

		expect(firstParagraph(readme)).toBe(
			"Быстрый инструмент для сжатия картинок. Работает везде.",
		);
	});

	it("пропускает списки, таблицы, цитаты и код", () => {
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

	it("пустой README даёт пустую строку", () => {
		expect(firstParagraph("")).toBe("");
		expect(firstParagraph("# Только заголовок\n")).toBe("");
		expect(firstParagraph("<!-- комментарий -->\n")).toBe("");
	});

	// GitHub отдаёт README с CRLF: без нормализации весь файл — один блок.
	it("понимает CRLF, как отдаёт GitHub", () => {
		const readme = [
			"# brul",
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

	it("переносит строки абзаца в пробелы", () => {
		expect(firstParagraph("Первый.\nВторой.\n")).toBe("Первый. Второй.");
	});
});

describe("inlineText", () => {
	it("убирает разметку, оставляя текст", () => {
		expect(
			inlineText(
				"Смотри [`config.toml`](a) и **жирное**, курсив *вот*, код `npm i`.",
			),
		).toBe("Смотри config.toml и жирное, курсив вот, код npm i.");
	});

	it("выкидывает картинки целиком", () => {
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

	it.each(["", "   ", "data:image/png;base64,AAA"])("не ссылка: %s", (src) => {
		expect(absoluteReadmeUrl(RAW, src)).toBeNull();
	});
});

describe("isBadgeUrl", () => {
	it.each([
		["https://img.shields.io/badge/build-passing-green", true],
		["https://badgen.net/github/stars/o/r", true],
		["https://codecov.io/gh/o/r/branch/main/graph/badge.svg", true],
		["https://nodei.co/npm/brul.png", true],
		["https://raw.githubusercontent.com/o/r/main/docs/shot.png", false],
		["https://github.com/o/r/assets/a.gif", false],
	])("%s → %s", (url, expected) => {
		expect(isBadgeUrl(url)).toBe(expected);
	});
});

describe("readmeImageUrls", () => {
	it("берёт markdown и html, чистит бейджи, резолвит относительные", () => {
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

	it("пустой README даёт пустой список", () => {
		expect(readmeImageUrls("", RAW)).toEqual([]);
	});

	it("понимает CRLF в разметке", () => {
		const readme =
			"![Скрин](docs/screenshot.png)\r\n\r\n![Ещё](docs/two.png)\r\n";
		expect(readmeImageUrls(readme, RAW)).toEqual([
			`${RAW}/docs/screenshot.png`,
			`${RAW}/docs/two.png`,
		]);
	});
});
