import "@testing-library/jest-dom/vitest"; // подгружаем матчеры
import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Page from "./+page.svelte";

describe("[lang]/+page.svelte", () => {
	it("should render h1", () => {
		render(Page, { data: { lang: "ru" } });
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toBeInTheDocument();
	});
});
