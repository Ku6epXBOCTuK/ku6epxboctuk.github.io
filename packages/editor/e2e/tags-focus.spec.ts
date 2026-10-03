import {
	deleteEntry,
	entryFromInput,
	removeTagFromRegistry,
	saveEntry,
} from "@ku6epxboctuk/content-core";
import { expect, test } from "@playwright/test";

test.describe("страница тегов", () => {
	test.afterAll(() => {
		for (const tag of ["e2e-one", "e2e-two"]) {
			try {
				removeTagFromRegistry(tag);
			} catch {
				// Тега могло не быть, если тест упал раньше добавления.
			}
		}
	});

	test("фокус остаётся в поле нового тега после Enter", async ({ page }) => {
		await page.goto("/tags");
		// Ждём и гидрацию, и первую загрузку списка: до гидрации у инпута нет
		// обработчиков, и ввод просто пропадает.
		await page.waitForResponse("**/api/tags");

		const input = page.getByLabel("новый тег");
		await input.click();

		await input.pressSequentially("e2e-one");
		await input.press("Enter");
		await expect(input).toBeFocused();
		await expect(input).toHaveValue("");

		await input.pressSequentially("e2e-two");
		await input.press("Enter");
		await expect(input).toBeFocused();
		await expect(input).toHaveValue("");

		await expect(page.getByRole("button", { name: "e2e-one" })).toBeVisible();
		await expect(page.getByRole("button", { name: "e2e-two" })).toBeVisible();
	});
});

test.describe("поле тегов в форме единицы", () => {
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

	test("Enter добавляет несколько тегов подряд, фокус не уходит", async ({
		page,
	}) => {
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

		await expect(page.locator(".tags-field .chips li")).toHaveCount(2);
	});
});
