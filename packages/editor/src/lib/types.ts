import type {
	ContentLang,
	ContentType,
	UnitSummary,
} from "@ku6epxboctuk/content-core/shared";

export interface UnitVersion {
	frontmatter: Record<string, unknown>;
	body: string;
}

export interface ValidationReport {
	errors: string[];
	warnings: string[];
}

export interface UnitDetail {
	summary: UnitSummary;
	ru: UnitVersion | null;
	en: UnitVersion | null;
	validation: ValidationReport;
}

export interface SaveResult {
	ok: true;
	validation: ValidationReport;
	created?: string;
	saved?: string;
	slug?: string;
}

export type Editable = Record<ContentLang, UnitVersion | null>;

export type EditorType = ContentType;
