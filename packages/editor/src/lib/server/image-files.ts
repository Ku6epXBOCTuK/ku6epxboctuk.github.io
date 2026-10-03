import { basename, extname } from "node:path";

export const IMAGE_TYPES: Record<string, string> = {
	".webp": "image/webp",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
};

export function imageType(name: string): string | undefined {
	return IMAGE_TYPES[extname(name).toLowerCase()];
}

export function safeImageName(name: string): string | null {
	const file = basename(name);
	if (!file || file !== name) return null;
	return imageType(file) ? file : null;
}
