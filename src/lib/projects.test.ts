import { describe, expect, it } from "vitest";

interface Orderable {
	order?: number;
}

// getProjects опирается на import.meta.glob, поэтому в юнит-тесте ту же
// логику сортировки проверяем на синтетических данных.
function byOrder(items: Orderable[]): Orderable[] {
	const unordered = Number.MAX_SAFE_INTEGER;
	return [...items].sort(
		(a, b) => (a.order ?? unordered) - (b.order ?? unordered),
	);
}

describe("порядок проектов", () => {
	it("меньшее число выше", () => {
		const items: Orderable[] = [{ order: 3 }, { order: 1 }, { order: 2 }];
		expect(byOrder(items).map((item) => item.order)).toEqual([1, 2, 3]);
	});

	it("без order уезжают в конец и не ломают список", () => {
		const items: Orderable[] = [{}, { order: 5 }, {}, { order: 1 }];
		const sorted = byOrder(items);
		expect(sorted[0]?.order).toBe(1);
		expect(sorted[1]?.order).toBe(5);
		expect(sorted.slice(2).every((item) => item.order === undefined)).toBe(
			true,
		);
	});

	it("пустой список не падает", () => {
		expect(byOrder([])).toEqual([]);
	});
});
