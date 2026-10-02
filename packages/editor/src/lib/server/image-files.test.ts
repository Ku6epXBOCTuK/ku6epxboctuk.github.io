// @vitest-environment node

import { describe, expect, it } from "vitest";
import { IMAGE_TYPES, imageType, safeImageName } from "./image-files.ts";

/*
 * Это единственное место, где имя из адреса превращается в путь на диске.
 * Ошибка читается как «картинка не грузится» или, что хуже, как чтение файла
 * за пределами `static/images`.
 */

describe("safeImageName", () => {
	it("пропускает расширения из белого списка", () => {
		for (const name of [
			"a.webp",
			"b.PNG",
			"c.jpg",
			"d.jpeg",
			"e.gif",
			"f.svg",
		]) {
			expect(safeImageName(name)).toBe(name);
		}
	});

	it("отсекает выход из папки", () => {
		for (const name of [
			"../secret.webp",
			"..\\secret.webp",
			"/etc/passwd",
			"a/b.webp",
			"",
			".",
			"..",
			"noext",
			"x.php",
			"x.html",
			"x.js",
			"x.exe",
		]) {
			expect(safeImageName(name)).toBeNull();
		}
	});

	it("не путает настоящее расширение и приписанное", () => {
		// Роут отдаёт по белому списку, а не по «наличию точки».
		expect(safeImageName("a.webp.php")).toBeNull();
		expect(safeImageName("a.php.webp")).toBe("a.php.webp");
	});
});

describe("imageType", () => {
	it("отдаёт правильный mime и не выдумывает его для неизвестного", () => {
		expect(imageType("a.webp")).toBe("image/webp");
		expect(imageType("a.GIF")).toBe("image/gif");
		expect(imageType("a.txt")).toBeUndefined();
	});

	it("список типов закрыт: то, что браузер не покажет, сюда не попало", () => {
		expect(Object.keys(IMAGE_TYPES).sort()).toEqual([
			".gif",
			".jpeg",
			".jpg",
			".png",
			".svg",
			".webp",
		]);
	});
});
