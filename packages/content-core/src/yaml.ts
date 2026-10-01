import * as yaml from "js-yaml";
import type { Frontmatter } from "./types.ts";

const DELIMITER = "---";

// Без кавычек YAML прочитает такие значения не как строки: "1" станет числом,
// "да" — булевым, а "текст: с двоеточием" развалит структуру.
const AMBIGUOUS = /[:#[\]{},&*!|>'"%@`\n]/;

const LEADING_INDICATOR = /^[-?:,[\]{}#&*!|>'"%@`]/;

const LOOKS_SCALAR = /^(true|false|null|~|yes|no|on|off)$/i;

const LOOKS_NUMBER = /^[+-]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

export function needsQuotes(value: string): boolean {
	if (value === "") return true;
	if (value !== value.trim()) return true;
	if (AMBIGUOUS.test(value)) return true;
	if (LEADING_INDICATOR.test(value)) return true;
	if (LOOKS_SCALAR.test(value)) return true;
	if (LOOKS_NUMBER.test(value)) return true;
	return false;
}

export function yamlStr(value: string): string {
	return needsQuotes(value) ? JSON.stringify(value) : value;
}

export interface ParsedUnit {
	frontmatter: Frontmatter;
	body: string;
}

export function parseUnit(raw: string): ParsedUnit {
	const text = raw.replace(/^\\uFEFF/, "");
	// Блок может быть пустым: `---\n---` читается как «полей нет». Раньше
	// требовалась непустая строка между разделителями, и такой файл отдавался
	// целиком в тело вместе с самими `---`.
	const match = /^---[ \t]*\r?\n([\s\S]*?)---[ \t]*\r?\n?/.exec(text);

	if (!match) return { frontmatter: {}, body: normalizeBody(text) };

	const block = match[1] ?? "";
	const data = block.trim() === "" ? undefined : (yaml.load(block) as unknown);
	const frontmatter: Frontmatter =
		data && typeof data === "object" && !Array.isArray(data)
			? (data as Frontmatter)
			: {};

	return { frontmatter, body: normalizeBody(text.slice(match[0].length)) };
}

// prettier ставит пустую строку после `---` и переносит текст, поэтому тело
// хранится без обрамления — иначе чтение и запись перестанут быть обратными.
export function normalizeBody(body: string): string {
	return body.replace(/^\n+/, "").replace(/\s+$/, "");
}

function line(key: string, value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "boolean") return `${key}: ${value}`;
	if (Array.isArray(value)) {
		const items = value.filter(
			(item): item is string => typeof item === "string",
		);
		if (items.length === 0) return undefined;
		return [`${key}:`, ...items.map((item) => `  - ${yamlStr(item)}`)].join(
			"\n",
		);
	}
	if (typeof value === "number") return `${key}: ${value}`;
	return `${key}: ${yamlStr(String(value))}`;
}

export function serializeUnit(frontmatter: Frontmatter, body: string): string {
	const lines: string[] = [];

	for (const [key, value] of Object.entries(frontmatter)) {
		const rendered = line(key, value);
		if (rendered !== undefined) lines.push(rendered);
	}

	const text = normalizeBody(body);
	return `---\n${lines.join("\n")}\n${DELIMITER}\n${text}\n`;
}
