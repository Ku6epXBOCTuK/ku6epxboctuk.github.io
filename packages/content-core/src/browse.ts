import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/*
 * Обзор папок для поля «Локальная папка».
 *
 * Системного диалога у браузера нет и быть не может: `showDirectoryPicker`
 * возвращает handle, у которого путь намеренно скрыт — веб не должен знать, где
 * лежат файлы. Страница на `127.0.0.1` исключением не является.
 *
 * Путь знает только Node, поэтому выбор делается здесь: сервер отдаёт список
 * подкаталогов, а форма его рисует. Модель доверия та же, что у всего
 * редактора: loopback без авторизации, файлы контента и так пишутся на диск.
 *
 * Содержимое файлов не читается — только имена папок и признак «это
 * git-репозиторий», чтобы можно было выбирать сразу клон, а не искать его
 * вручную.
 */

/** Скрытые папки и служебные каталоги в список не попадают. */
const SKIP = new Set([".git", "node_modules", ".cache", ".pnpm-store"]);

/** Сколько уровней вверх предлагать: чем дальше, тем меньше шансов попасть туда. */
const BROWSE_DEPTH = 3;

export interface DirEntry {
	name: string;
	/** Полный путь. Собирает его сервер: форма не должна знать про разделители. */
	full: string;
	/** Внутри есть `.git` — похоже на клон проекта. */
	isRepo: boolean;
}

export interface DirListing {
	path: string;
	/** Куда можно подняться; `null` — корень диска. */
	parent: string | null;
	dirs: DirEntry[];
}

/**
 * Точки входа в обзор: родитель сайта и выше. Самодостаточные проекты обычно
 * лежат рядом с сайтом, но на разных машинах по-разному, поэтому предлагаем и
 * их, и несколько уровней вверх.
 */
export function browseRoots(base: string): string[] {
	const out: string[] = [];
	let current = base;

	for (let depth = 0; depth < BROWSE_DEPTH; depth++) {
		const parent = dirname(current);
		if (parent === current) break;
		out.push(parent);
		current = parent;
	}

	return out;
}

function isDirectory(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Подкаталоги указанной папки. Отсутствующая или недоступная папка даёт пустой
 * список, а не исключение: обзор должен уметь зайти в любое место и выйти
 * обратно, а не падать на правах доступа.
 */
export function listDirs(path: string): DirListing {
	const target = resolve(path);
	const parentOf = dirname(target);
	const parent = parentOf === target ? null : parentOf;
	const dirs: DirEntry[] = [];

	if (!isDirectory(target)) {
		return { path: target, parent, dirs };
	}

	let names: string[];
	try {
		names = readdirSync(target);
	} catch {
		return { path: target, parent, dirs };
	}

	for (const name of names.sort((a, b) => a.localeCompare(b))) {
		if (SKIP.has(name) || name.startsWith(".")) continue;
		const child = join(target, name);
		if (!isDirectory(child)) continue;
		dirs.push({
			name,
			full: child,
			isRepo: existsSync(join(child, ".git")),
		});
	}

	return { path: target, parent, dirs };
}

/**
 * Текущая папка обзора для уже сохранённого значения: абсолютный путь остаётся
 * собой, относительный разрешается от корня сайта. Это же делает `resolve`, но
 * явно: пустой путь открывает обзор с корня сайта, а не с диска.
 */
export function dirOf(value: string | undefined, base: string): string {
	const trimmed = value?.trim();
	return trimmed ? resolve(base, trimmed) : resolve(base);
}
