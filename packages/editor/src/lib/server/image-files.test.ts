// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it } from "vitest";
import { IMAGE_TYPES, imageType, safeImageName } from "./image-files.ts";

describe("safeImageName", () => {
	it("allows extensions from the allow list", () => {
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

	it("rejects path traversal", () => {
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

	it("does not confuse the real extension with a trailing one", () => {
		expect(safeImageName("a.webp.php")).toBeNull();
		expect(safeImageName("a.php.webp")).toBe("a.php.webp");
	});
});

describe("imageType", () => {
	it("returns the right mime and does not invent one for unknown", () => {
		expect(imageType("a.webp")).toBe("image/webp");
		expect(imageType("a.GIF")).toBe("image/gif");
		expect(imageType("a.txt")).toBeUndefined();
	});

	it("the type list is closed: nothing the browser cannot show", () => {
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
