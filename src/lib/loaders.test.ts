import { describe, expect, it } from "vitest";
import { createPairLoader } from "$lib/loaders";
import { mergeShared, sharedFrom } from "$lib/shared";
import type { MarkdownModule } from "$lib/content";

/*
 * Сайт читает общие поля из `<type>s.json`, а переводимые — из языковых файлов.
 * Проверяется ровно эта склейка: если она развалится, на страницах пропадут
 * даты, теги и обложки, и заметить это можно только глазами.
 *
 * Glob в тест не тащится: наполнение подставляется напрямую.
 */

const module = (frontmatter: Record<string, unknown>): MarkdownModule =>
	({ default: () => null, frontmatter }) as unknown as MarkdownModule;

const MODULES = {
	"/src/content/articles/hello/index.ru.md": module({ title: "Заголовок" }),
	"/src/content/articles/hello/index.en.md": module({ title: "Title" }),
};

const SHARED = {
	hello: {
		date: "2026-09-30",
		tags: ["svelte", "будни"],
		image: "/images/hello.png",
		draft: false,
	},
};

describe("общие поля из json", () => {
	it("доезжают до записи вместе с переводимыми из md", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry) => entry,
		});

		const [item] = loader.getItems("ru");

		expect(item.slug).toBe("hello");
		expect(item.title).toBe("Заголовок");
		expect(item.date).toBe("2026-09-30");
		expect(item.tags).toEqual(["svelte", "будни"]);
		expect(item.image).toBe("/images/hello.png");
	});

	it("перевод читает свой файл, общее — то же самое значение", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry) => entry,
		});

		const en = loader.getItem("hello", "en");

		expect(en?.title).toBe("Title");
		expect(en?.date).toBe("2026-09-30");
		expect(en?.tags).toEqual(["svelte", "будни"]);
	});

	it("общего json нет — запись собирается из md и не падает", () => {
		const loader = createPairLoader({
			modules: MODULES,
			toItem: (entry) => entry,
		});

		const [item] = loader.getItems("ru");
		expect(item.title).toBe("Заголовок");
		expect(item.date).toBe("");
		expect(item.tags).toEqual([]);
	});

	it("склеенный frontmatter отдаётся в toItem", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry, fm) => ({ ...entry, link: fm.date }),
		});

		expect(loader.getItem("hello", "ru")?.link).toBe("2026-09-30");
	});
});

describe("sharedFrom", () => {
	it("разворачивает карту `{путь: запись}` в саму запись", () => {
		const glob = { "/src/content/articles.json": SHARED };
		expect(sharedFrom(glob)).toEqual(SHARED);
	});

	it("пустой glob даёт undefined, а не пустой объект с путём", () => {
		// Именно тут была ошибка: путь принимался за slug, и общие поля молча
		// терялись — страницы оставались без дат и тегов.
		expect(sharedFrom({})).toBeUndefined();
		expect(sharedFrom(undefined)).toBeUndefined();
	});
});

describe("mergeShared", () => {
	it("поздний источник перекрывает ранний по полям, а не по slug", () => {
		const merged = mergeShared(
			{ hello: { date: "2026-01-01", tags: ["старые"] } },
			{ hello: { date: "2026-09-30" }, other: { date: "2026-09-01" } },
		);

		expect(merged).toEqual({
			hello: { date: "2026-09-30", tags: ["старые"] },
			other: { date: "2026-09-01" },
		});
	});
});
