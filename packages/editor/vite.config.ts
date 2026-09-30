import { spawn } from "node:child_process";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type PluginOption } from "vite";
import { readToken } from "./src/lib/server/token.ts";

const HOST = "127.0.0.1";
const PORT = 4321;

function openBrowser(url: string): void {
	const command =
		process.platform === "win32"
			? ["cmd", ["/c", "start", "", url]]
			: process.platform === "darwin"
				? ["open", [url]]
				: ["xdg-open", [url]];

	const child = spawn(command[0] as string, command[1] as string[], {
		stdio: "ignore",
		detached: true,
	});
	child.on("error", () => {});
	child.unref();
}

function announceUrl(): PluginOption {
	return {
		name: "editor:announce",
		apply: "serve",
		configureServer(server) {
			const url = `http://${HOST}:${PORT}/auth?t=${readToken()}`;
			server.config.logger.info(`\n  редактор: ${url}\n`);
			console.log(`\n  Редактор: ${url}\n`);
			setTimeout(() => openBrowser(url), 300);
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
