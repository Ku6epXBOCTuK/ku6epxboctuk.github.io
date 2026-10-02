import { basename, extname } from "node:path";

/*
 * Имя картинки приходит из адреса, а превращается в путь на диске. Поэтому
 * правило одно и проверяемое: расширение из белого списка и никакого выхода из
 * папки. Вынесено отдельно от роута, чтобы его можно было покрыть тестом
 * напрямую, а не копией правила.
 */

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

/** `null`, если имя не годится: пустое, с путём внутри или не картинка. */
export function safeImageName(name: string): string | null {
	const file = basename(name);
	if (!file || file !== name) return null;
	return imageType(file) ? file : null;
}
