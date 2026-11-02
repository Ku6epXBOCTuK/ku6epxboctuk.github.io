import * as fs from "node:fs";
import { dirname, join } from "node:path";

// NOTE: writes are atomic (temp file, then rename) because each save rewrites
// `<type>s.json` whole and a torn write would lose the whole type.

const INDENT = "\t";
const NEWLINE = "\n";

export class JsonReadError extends Error {
	constructor(
		readonly file: string,
		readonly cause: unknown,
	) {
		super(`Не удалось прочитать ${file}: ${(cause as Error).message}`);
		this.name = "JsonReadError";
	}
}

export function readJsonFile<T>(file: string): T | undefined {
	if (!fs.existsSync(file)) return undefined;

	let raw: string;
	try {
		raw = fs.readFileSync(file, "utf8");
	} catch (err) {
		throw new JsonReadError(file, err);
	}

	try {
		return JSON.parse(raw) as T;
	} catch (err) {
		throw new JsonReadError(file, err);
	}
}

export function writeJsonFile(file: string, data: unknown): void {
	fs.mkdirSync(dirname(file), { recursive: true });

	const temp = join(dirname(file), `.${basename(file)}.tmp`);
	try {
		fs.writeFileSync(temp, serialize(data), "utf8");
		fs.renameSync(temp, file);
	} catch (err) {
		// NOTE: a failed write must not leave the temp file behind; the next run
		// would treat it as content.
		fs.rmSync(temp, { force: true });
		throw err;
	}
}

export function serialize(data: unknown): string {
	return `${JSON.stringify(data, null, INDENT)}${NEWLINE}`;
}

function basename(file: string): string {
	const parts = file.split(/[\\/]/);
	return parts[parts.length - 1] ?? file;
}

// NOTE: keys are sorted so saved files keep a stable order and git diffs stay
// meaningful.
export function writeJsonRecord(
	file: string,
	entries: Record<string, unknown>,
): void {
	const ordered: Record<string, unknown> = {};
	for (const slug of Object.keys(entries).sort()) {
		ordered[slug] = entries[slug];
	}
	writeJsonFile(file, ordered);
}
