import { defineConfig } from "@playwright/test";

export default defineConfig({
	webServer: {
		command: "pnpm dev",
		port: 4321,
		reuseExistingServer: true,
	},
	testDir: "e2e",
	use: {
		baseURL: "http://127.0.0.1:4321",
	},
});
