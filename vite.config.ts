import { sveltekit } from "@sveltejs/kit/vite";
import svelteMd from "vite-plugin-svelte-md";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [svelteMd({ headEnabled: false }), sveltekit()],
});
