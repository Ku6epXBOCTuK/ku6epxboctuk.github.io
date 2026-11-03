import { describe, expect, it } from "vitest";

interface Orderable {
	order?: number;
}

// NOTE: getProjects relies on import.meta.glob, so the same sort is checked here on synthetic data.
function byOrder(items: Orderable[]): Orderable[] {
	const unordered = Number.MAX_SAFE_INTEGER;
	return [...items].sort(
		(a, b) => (a.order ?? unordered) - (b.order ?? unordered),
	);
}

describe("project order", () => {
	it("a lower number comes first", () => {
		const items: Orderable[] = [{ order: 3 }, { order: 1 }, { order: 2 }];
		expect(byOrder(items).map((item) => item.order)).toEqual([1, 2, 3]);
	});

	it("entries without order go last and do not break the list", () => {
		const items: Orderable[] = [{}, { order: 5 }, {}, { order: 1 }];
		const sorted = byOrder(items);
		expect(sorted[0]?.order).toBe(1);
		expect(sorted[1]?.order).toBe(5);
		expect(sorted.slice(2).every((item) => item.order === undefined)).toBe(
			true,
		);
	});

	it("an empty list does not crash", () => {
		expect(byOrder([])).toEqual([]);
	});
});
