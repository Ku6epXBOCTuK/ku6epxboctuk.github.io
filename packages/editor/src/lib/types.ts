import type { Entry, UnitSummary } from "@ku6epxboctuk/content-core/shared";

export interface ValidationReport {
	errors: string[];
	warnings: string[];
}

/**
 * Данные страницы правки: сама единица и разбор валидации.
 *
 * Раньше здесь лежали `ru` и `en` с общими полями, продублированными в оба
 * frontmatter. Теперь форма правит ровно то, что лежит в `Entry`, и ничего не
 * знает про раскладку по файлам — этим занят репозиторий.
 */
export interface EntryDetail {
	entry: Entry;
	validation: ValidationReport;
}

export interface SaveResult {
	ok: true;
	validation: ValidationReport;
}

export interface CreateResult extends SaveResult {
	slug: string;
}

export type EditorUnits = UnitSummary[];

export interface TagUnit {
	type: string;
	slug: string;
}

export interface TagRow {
	tag: string;
	count: number;
	units: TagUnit[];
	/** Есть ли тег в списке `tags.json`. */
	listed: boolean;
}

/** Ответ `/api/tags/plan`: что будет, если переименовать тег. */
export interface TagPlan {
	from: string;
	to: string;
	exists: boolean;
	merge: boolean;
	affected: number;
	duplicates: number;
	resultCount: number;
}

/** Что удаляем из удаляемой записи: из списка, из контента или и то и другое. */
export type TagDropScope = "list" | "content" | "both";
