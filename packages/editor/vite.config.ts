import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const HOST = "127.0.0.1";
const PORT = 4321;

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: HOST,
		port: PORT,
		strictPort: true,
	},
});
