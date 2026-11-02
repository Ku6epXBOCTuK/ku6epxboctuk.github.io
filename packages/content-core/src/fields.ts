import type { ContentType, SchemaType } from "./types.ts";

// NOTE: "text" is a multiline input and "markdown" is the post body; `string` matches Frontmatter CMS.
export type FieldKind =
	| "string"
	| "text"
	| "markdown"
	| "boolean"
	| "string[]"
	| "number"
	| "date"
	| "url"
	| "image"
	| "choice"
	| "icon"
	| "dir";

/**
 * Where a field physically lives: `translatable` in `index.<lang>.md`, `shared`
 * in `<type>s.json`, `local` in the gitignored `<type>s.local.json`. Storage
 * reads only `scope`, so moving a field between files is one line.
 */
export type FieldScope = "translatable" | "shared" | "local";

export interface FieldDef {
	name: string;
	kind: FieldKind;
	label: string;
	required: boolean;
	scope: FieldScope;

	hidden?: boolean;
	help?: string;
	choices?: readonly string[];
	default?: string | boolean;
	/** Set by code; not editable in the form. */
	auto?: boolean;
}

const DRAFT = {
	name: "draft",
	kind: "boolean",
	label: "Черновик",
	required: false,
	scope: "shared",
} as const;

const IMAGE = {
	name: "image",
	kind: "image",
	label: "Обложка",
	required: false,

	scope: "shared",
} as const;

const NEEDS_TRANSLATION = {
	name: "needs_translation",
	kind: "boolean",
	label: "Нужен перевод",
	required: false,
	auto: true,
	scope: "translatable",
	help: "Ставится кнопкой «Скопировать из RU». Убрать, когда переведёшь.",
} as const;

const TAGS = {
	name: "tags",
	kind: "string[]",
	label: "Теги",
	required: false,
	scope: "shared",
} as const;

// NOTE: the glyph set is closed because the glyph is printed into the project
// card; `color` is bounded the same way, `ProjectDetail` reads three values.
const PROJECT_ICONS = [
	"◈",
	"◇",
	"●",
	"▲",
	"✦",
	"✧",
	"✿",
	"❒",
	"▦",
	"⬡",
	"◌",
	"🐾",
] as const;

const TITLE = {
	name: "title",
	kind: "string",
	label: "Заголовок",
	required: true,
	scope: "translatable",
} as const;

const DATE = {
	name: "date",
	kind: "date",
	label: "Дата",
	required: true,
	default: "today",
	scope: "shared",
} as const;

const SCHEMA = {
	post: [
		TITLE,
		DATE,
		TAGS,
		{ ...IMAGE, required: true },
		{
			name: "link",
			kind: "url",
			label: "Ссылка",
			required: false,
			scope: "shared",
		},
		DRAFT,
		NEEDS_TRANSLATION,
	],
	article: [TITLE, DATE, TAGS, IMAGE, DRAFT, NEEDS_TRANSLATION],
	project: [
		TITLE,
		{
			name: "subtitle",
			kind: "string",
			label: "Подзаголовок",
			required: false,
			scope: "translatable",
		},
		{
			name: "description",
			kind: "text",
			label: "Описание",
			required: false,
			scope: "translatable",
		},
		TAGS,
		IMAGE,
		{
			name: "repo",
			kind: "url",
			label: "Репозиторий",
			required: true,
			scope: "shared",
		},
		{
			name: "homepage",
			kind: "url",
			label: "Демо",
			required: false,
			scope: "shared",
		},
		{
			name: "status",
			kind: "choice",
			label: "Статус",
			required: false,
			choices: ["raw", "ready", "need_review"],
			default: "ready",
			scope: "shared",
		},
		{
			name: "order",
			kind: "number",
			label: "Порядок",
			required: false,
			scope: "shared",
		},
		{
			name: "icon",
			kind: "icon",
			label: "Иконка",
			required: false,
			choices: PROJECT_ICONS,
			scope: "shared",
			help: "Глиф для карточки проекта.",
		},
		{
			name: "color",
			kind: "choice",
			label: "Цвет",
			required: false,
			choices: ["coral", "periwinkle", "sky"],
			scope: "shared",
		},
		{
			name: "path",
			kind: "dir",
			label: "Локальная папка",
			required: false,
			scope: "local",
			help: "Путь к клону, из которого берутся git-логи для недельников.",
		},
		DRAFT,
		NEEDS_TRANSLATION,
	],
	// NOTE: `weekly` is generated from git logs and has no entry in `FIELDS`,
	// but its files exist and validation reads this schema.
	weekly: [
		{
			name: "title",
			kind: "string",
			label: "Заголовок",
			required: false,
			scope: "translatable",
		},
		{
			name: "excerpt",
			kind: "text",
			label: "Отрывок",
			required: true,
			scope: "translatable",
		},
		DATE,
		TAGS,
		DRAFT,
		NEEDS_TRANSLATION,
	],
} as const satisfies Record<SchemaType, readonly FieldDef[]>;

export type FieldsOf<T extends SchemaType> = (typeof SCHEMA)[T];

export type FieldsByScope<T extends SchemaType, S extends FieldScope> = Extract<
	FieldsOf<T>[number],
	{ scope: S }
>;

export type FieldNames<
	T extends SchemaType,
	S extends FieldScope,
> = FieldsByScope<T, S>["name"];

export const FIELDS: Record<ContentType, readonly FieldDef[]> = {
	post: SCHEMA.post,
	article: SCHEMA.article,
	project: SCHEMA.project,
};

export const ALL_FIELDS: Record<SchemaType, readonly FieldDef[]> = SCHEMA;

export function fieldsForType(type: string): readonly FieldDef[] {
	return (ALL_FIELDS as Record<string, readonly FieldDef[]>)[type] ?? [];
}

export function fieldNames(type: ContentType): string[] {
	return FIELDS[type].map((field) => field.name);
}

const DATE_LENGTH = 10;

// NOTE: only schema fields can be seeded; `lint:content` rejects a key that
// `content.schema.json` does not declare.
export function defaultsFor(type: ContentType): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const field of FIELDS[type]) {
		if (field.hidden || field.auto || field.default === undefined) continue;
		out[field.name] =
			field.default === "today"
				? new Date().toISOString().slice(0, DATE_LENGTH)
				: field.default;
	}

	return out;
}

// NOTE: hidden and auto fields are included on purpose: the schema files must
// declare `needs_translation` even though the form never shows it.
export function fieldsWithScope(type: string, scope: FieldScope): FieldDef[] {
	return fieldsForType(type).filter((field) => field.scope === scope);
}

// NOTE: `undefined` means the schema has no such field; storage ignores it and
// validation reports it.
export function fieldScope(type: string, name: string): FieldScope | undefined {
	return fieldsForType(type).find((field) => field.name === name)?.scope;
}

// NOTE: knowledge of what is translatable, shared or local lives only here.
// Hidden and auto fields are left out because the form cannot edit them, but
// their scope stays so storage still files them correctly.
export function fieldsByScope(type: string, scope: FieldScope): FieldDef[] {
	return fieldsWithScope(type, scope).filter(
		(field) => !field.hidden && !field.auto,
	);
}

export function editableFields(type: string): FieldDef[] {
	return fieldsForType(type).filter((field) => !field.hidden && !field.auto);
}
