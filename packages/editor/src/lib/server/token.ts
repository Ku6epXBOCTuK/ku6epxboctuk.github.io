import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Токен лежит в файле, а не в памяти процесса: конфиг Vite и SSR-граф
// SvelteKit — разные экземпляры модулей, общее у них только ФС.
const EDITOR_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");

const HASH_LENGTH = 12;

const MIN_LENGTH = 32;

const TOKEN_FILE = join(
	tmpdir(),
	`ku6epxboctuk-editor-${createHash("sha256").update(EDITOR_ROOT).digest("hex").slice(0, HASH_LENGTH)}.token`,
);

export function readToken(): string {
	if (process.env.EDITOR_TOKEN) return process.env.EDITOR_TOKEN;

	if (existsSync(TOKEN_FILE)) {
		const value = readFileSync(TOKEN_FILE, "utf8").trim();
		if (value.length >= MIN_LENGTH) return value;
	}

	const token = randomBytes(MIN_LENGTH).toString("hex");
	writeFileSync(TOKEN_FILE, token, "utf8");
	return token;
}

export function editorRoot(): string {
	return EDITOR_ROOT;
}

export function tokenFile(): string {
	return TOKEN_FILE;
}
