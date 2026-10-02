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
