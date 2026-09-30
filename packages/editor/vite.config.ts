import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type PluginOption } from "vite";
import { readToken } from "./src/lib/server/token.ts";

const HOST = "127.0.0.1";
const PORT = 4321;

function announceUrl(): PluginOption {
	return {
		name: "editor:announce",
		apply: "serve",
		configureServer(server) {
			server.config.logger.info(
				`\n  редактор: http://${HOST}:${PORT}/auth?t=${readToken()}\n`,
			);
		},
	};
}

export default defineConfig({
	plugins: [announceUrl(), sveltekit()],
	server: {
		host: HOST,
		port: PORT,
		strictPort: true,
	},
});
