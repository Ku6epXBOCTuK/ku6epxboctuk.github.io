import {
	deleteEntry,
	entryFromInput,
	removeTagFromRegistry,
	saveEntry,
} from "@ku6epxboctuk/content-core";
import { expect, test } from "@playwright/test";

test.describe("tags page", () => {
	test.afterAll(() => {
		for (const tag of ["e2e-one", "e2e-two"]) {
			try {
				removeTagFromRegistry(tag);
			} catch {
				void 0;
			}
		}
	});

	test("focus stays in the new tag field after Enter", async ({ page }) => {
		await page.goto("/tags");
		await page.waitForResponse("**/api/tags");

		const input = page.getByLabel("новый тег");
		await input.click();

		await input.pressSequentially("e2e-one");
		await input.press("Enter");
		await expect(input).toBeFocused();
		await expect(input).toHaveValue("");
		await expect(page.getByRole("button", { name: "e2e-one" })).toBeVisible();

		await input.pressSequentially("e2e-two");
		await input.press("Enter");
		await expect(input).toBeFocused();
		await expect(input).toHaveValue("");
		await expect(page.getByRole("button", { name: "e2e-two" })).toBeVisible();
	});
});

test.describe("tags field in the unit form", () => {
	const TYPE = "post";
	const SLUG = "e2e-tags-focus";

	test.beforeAll(async () => {
		await saveEntry(
			TYPE,
			SLUG,
			entryFromInput(TYPE, SLUG, {
				shared: { date: "2026-10-03", tags: [] },
				versions: {
					ru: { frontmatter: { title: "E2E" }, body: "x" },
					en: { frontmatter: { title: "E2E" }, body: "" },
				},
			}),
		);
	});

	test.afterAll(() => {
		deleteEntry(TYPE, SLUG);
	});

	test("Enter adds several tags in a row and focus stays", async ({ page }) => {
		await page.goto(`/${TYPE}/${SLUG}`);
		await expect(page.locator("#ru-title")).toHaveValue("E2E");

		const input = page.locator("#shared-tags");
		await input.click();

		await input.pressSequentially("alpha");
		await input.press("Enter");
		await expect(input).toBeFocused();

		await input.pressSequentially("beta");
		await input.press("Enter");
		await expect(input).toBeFocused();

		await expect(page.locator(".ui-tag-chips li")).toHaveCount(2);
	});
});
