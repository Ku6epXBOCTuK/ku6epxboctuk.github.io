import type { ContentType, SchemaType } from "./types.ts";

// Виды редактора не совпадают с типами Frontmatter CMS: там `string`,
// здесь `text` для многострочного ввода и `markdown` для тела поста.
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
	| "choice";

/**
 * Куда поле физически лежит. Единственная ось вместо прежних `only` и
 * `shared`, которые означали разное и не выражались друг через друга.
 *
 * - `translatable` — frontmatter `index.<lang>.md`, своё значение на язык.
 * - `shared` — `<type>s.json`, одно значение на единицу контента: теги,
 *   ссылки, дата, обложка, статус.
 * - `local` — `<type>s.local.json` в гитигноре: факты о машине, не о контенте.
 *
 * Раскладка хранится только здесь. Репозиторий раскладывает поля по `scope` и
 * ничего не знает про конкретные имена, поэтому перенос поля между файлами —
 * смена одной строки, а не правка чтения и записи.
 */
export type FieldScope = "translatable" | "shared" | "local";

export interface FieldDef {
	name: string;
	kind: FieldKind;
	label: string;
	required: boolean;
	scope: FieldScope;
	/** Скрыть из формы, но оставить в схеме. */
	hidden?: boolean;
	help?: string;
	choices?: readonly string[];
	default?: string | boolean;
	/** Ставится кодом, в форме не редактируется. */
	auto?: boolean;
}

/*
 * Дальше схема объявлена через `as const`, и это не косметика: из неё выводятся
 * имена полей, и `Entry` типизируется конкретными ключами, а не
 * `Record<string, unknown>`. Ручные интерфейсы полей продублировали бы схему и
 * разошлись бы с ней на первой же правке.
 */

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
	// Сейчас одна картинка на оба языка: так проще. Если понадобится своя
	// картинка для перевода, меняется только эта строка.
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

/**
 * Литеральная схема, приватная. Из неё выводятся имена полей для типов, а
 * наружу отдаётся `readonly FieldDef[]`: `as const` не оставляет у записи
 * необязательные свойства (`auto`, `default`, `help`), и любое их чтение
 * требовало бы каста в каждом месте.
 */
const SCHEMA = {
	post: [
		TITLE,
		DATE,
		TAGS,
		IMAGE,
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
			required: true,
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
			kind: "string",
			label: "Иконка",
			required: false,
			scope: "shared",
			help: "Имя иконки для карточки проекта.",
		},
		{
			name: "color",
			kind: "string",
			label: "Цвет",
			required: false,
			scope: "shared",
		},
		{
			name: "synced_at",
			kind: "date",
			label: "Синхронизирован",
			required: false,
			scope: "shared",
		},
		{
			name: "path",
			kind: "string",
			label: "Локальная папка",
			required: false,
			scope: "local",
			help: "Путь к клону относительно корня сайта, например ../brul. Нужен weekly, чтобы собрать git-логи.",
		},
		DRAFT,
		NEEDS_TRANSLATION,
	],
	/**
	 * `weekly` генерируется из git-логов, руками не редактируется и типа в
	 * `FIELDS` не имеет. Схема ему всё равно нужна: файлы есть, и валидация их
	 * читает.
	 */
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

/** Имена полей места хранения — выведены из схемы, рукописных списков нет. */
export type FieldNames<
	T extends SchemaType,
	S extends FieldScope,
> = FieldsByScope<T, S>["name"];

/** Типы, которые редактор правит руками. */
export const FIELDS: Record<ContentType, readonly FieldDef[]> = {
	post: SCHEMA.post,
	article: SCHEMA.article,
	project: SCHEMA.project,
};

/** Все типы, у которых есть схема, включая генерируемый `weekly`. */
export const ALL_FIELDS: Record<SchemaType, readonly FieldDef[]> = SCHEMA;

export function fieldsForType(type: string): readonly FieldDef[] {
	return (ALL_FIELDS as Record<string, readonly FieldDef[]>)[type] ?? [];
}

export function fieldNames(type: ContentType): string[] {
	return FIELDS[type].map((field) => field.name);
}

const DATE_LENGTH = 10;

/**
 * Значения по умолчанию строго из схемы. Нельзя сеять поле, которого нет в
 * `content.schema.json`: линтер отвергнет такой файл.
 */
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

/**
 * Все поля места хранения, включая скрытые и ставящиеся кодом. По этой
 * раскладке сверяются `frontmatter.json` и `content.schema.json`: там
 * `needs_translation` есть, хотя в форме его нет.
 */
export function fieldsWithScope(type: string, scope: FieldScope): FieldDef[] {
	return fieldsForType(type).filter((field) => field.scope === scope);
}

/**
 * Где поле должно лежать. `undefined` — поля нет в схеме: и репозиторий, и
 * редактор такое значение молча игнорируют, а сообщает про него валидация.
 */
export function fieldScope(type: string, name: string): FieldScope | undefined {
	return fieldsForType(type).find((field) => field.name === name)?.scope;
}

/**
 * Разбивка полей по месту хранения. Единственное место, где живёт знание о том,
 * что переводится, что общее и что локальное; репозиторий берёт готовые списки и
 * не разбирает поля по именам.
 *
 * Скрытые и ставящиеся кодом поля не отдаются: их нельзя править в форме. `scope`
 * у них при этом остаётся, и репозиторий знает, куда их класть.
 */
export function fieldsByScope(type: string, scope: FieldScope): FieldDef[] {
	return fieldsWithScope(type, scope).filter(
		(field) => !field.hidden && !field.auto,
	);
}

/** Поля, которые редактор показывает: всё, кроме скрытых и ставящихся кодом. */
export function editableFields(type: string): FieldDef[] {
	return fieldsForType(type).filter((field) => !field.hidden && !field.auto);
}
