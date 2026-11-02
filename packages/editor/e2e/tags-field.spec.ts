import {
	addTagToRegistry,
	deleteEntry,
	entryFromInput,
	removeTagFromRegistry,
	saveEntry,
} from "@ku6epxboctuk/content-core";
import { expect, test, type Page } from "@playwright/test";

const TYPE = "post";
const SLUG = "e2e-tags-field";

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
	for (const tag of ["svelte", "sveltekit"]) addTagToRegistry(tag);
});

test.afterAll(() => {
	deleteEntry(TYPE, SLUG);
	for (const tag of ["svelte", "sveltekit"]) {
		try {
			removeTagFromRegistry(tag);
		} catch {
			void 0;
		}
	}
});

async function openForm(page: Page) {
	await page.goto(`/${TYPE}/${SLUG}`);
	await expect(page.locator("#ru-title")).toHaveValue("E2E");
}

const chips = (page: Page) => page.locator(".tags-field .chips li");

test("tags are added without Enter: comma and space, case ignored", async ({
	page,
}) => {
	await openForm(page);

	const input = page.locator("#shared-tags");
	await input.click();
	await input.pressSequentially("CSS, Html ");

	await expect(chips(page)).toHaveText(["css", "html"]);
	await expect(input).toBeFocused();
	await expect(input).toHaveValue("");
});

test("hints highlight the match and add on click", async ({ page }) => {
	await openForm(page);

	const input = page.locator("#shared-tags");
	await input.click();
	await input.pressSequentially("SVELTEK");

	const mark = page.locator(".tags-field .hints mark");
	await expect(mark).toHaveText("sveltek");

	await page.locator(".tags-field .hints button").first().click();
	await expect(chips(page)).toHaveText(["sveltekit"]);
	await expect(input).toBeFocused();
});

test("chips can be dragged to change order", async ({ page }) => {
	await openForm(page);

	const input = page.locator("#shared-tags");
	await input.click();
	await input.pressSequentially("one two three ");
	await expect(chips(page)).toHaveText(["one", "two", "three"]);

	const items = page.locator(".tags-field .chips li");
	await items.nth(0).dragTo(items.nth(2));

	await expect(chips(page)).toHaveText(["two", "three", "one"]);
});

test("clicking a chip copies the tag to the clipboard", async ({
	page,
	context,
}) => {
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await openForm(page);

	const input = page.locator("#shared-tags");
	await input.click();
	await input.pressSequentially("css ");

	await page.getByRole("button", { name: "скопировать тег css" }).click();
	await expect(chips(page).first()).toHaveText("скопировано");

	const clipboard = await page.evaluate(() => navigator.clipboard.readText());
	expect(clipboard).toBe("css");
});
