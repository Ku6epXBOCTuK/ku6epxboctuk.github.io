import type { ImageKind } from "$lib/server/images.ts";

export interface UploadResult {
	path: string;
	width: number;
	height: number;
	bytes: number;
	passThrough: boolean;
}

export async function uploadImage(options: {
	file: File;
	kind: ImageKind;
	slug: string;
	replace?: string;
}): Promise<UploadResult> {
	const form = new FormData();
	form.set("file", options.file);
	form.set("kind", options.kind);
	form.set("slug", options.slug);
	if (options.replace) form.set("replace", options.replace);

	const res = await fetch("/api/images", { method: "POST", body: form });
	const data = await res.json().catch(() => ({}));

	if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
	return data as UploadResult;
}

const KB = 1024;
const MB_IN_BYTES = KB * KB;

export function describeSize(bytes: number): string {
	if (bytes < KB) return `${bytes} Б`;
	if (bytes < MB_IN_BYTES) return `${Math.round(bytes / KB)} КБ`;
	return `${(bytes / MB_IN_BYTES).toFixed(1)} МБ`;
}
