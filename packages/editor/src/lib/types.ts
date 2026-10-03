import type { Entry, EntrySummary } from "@ku6epxboctuk/content-core/shared";

export interface ValidationReport {
	errors: string[];
	warnings: string[];
}

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

export type EditorUnits = EntrySummary[];

export interface TagUnit {
	type: string;
	slug: string;
}

export interface TagRow {
	tag: string;
	count: number;
	units: TagUnit[];
	listed: boolean;
}

export interface TagPlan {
	from: string;
	to: string;
	exists: boolean;
	merge: boolean;
	affected: number;
	duplicates: number;
	resultCount: number;
}

export type TagDropScope = "list" | "content" | "both";
