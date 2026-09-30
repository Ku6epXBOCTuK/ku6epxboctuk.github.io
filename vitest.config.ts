import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vitest/config";
import svelteMd from "vite-plugin-svelte-md";

export default defineConfig({
	plugins: [
		svelteMd({ headEnabled: false }),
		sveltekit(),
		Icons({
			compiler: "svelte",
		}),
	],
	test: {
		environment: "jsdom",
		globals: true,
		isolate: true,
		setupFiles: ["./src/vitest.setup.ts"],
		include: ["**/*.{test,spec}.{js,ts}"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.svelte-kit/**",
			"**/build/**",
			"e2e/**",
		],
		env: {
			DEBUG_PRINT_LIMIT: "2000",
		},
		coverage: {
			provider: "istanbul",
			enabled: true,
			include: ["src/**/*.{js,ts,svelte}"],
			exclude: [
				"src/**/*.d.ts",
				"src/**/types.ts",
				"src/**/index.ts",
				"**/*.config.*",
				"**/build/**",
				"**/node_modules/**",
				"**/coverage/**",
			],
		},
		server: {
			deps: {
				inline: [/unplugin-icons/],
			},
		},
	},
	resolve: process.env.VITEST
		? {
				conditions: ["browser"],
			}
		: undefined,
});
