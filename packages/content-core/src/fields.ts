import type { ContentType } from "./types.ts";

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

export interface FieldDef {
	name: string;
	kind: FieldKind;
	label: string;
	required: boolean;
	/** Скрыть из формы, но оставить в схеме — как у `isMock`. */
	hidden?: boolean;
	help?: string;
	choices?: string[];
	default?: string | boolean;
	/** Ставится кодом, в форме не редактируется. */
	auto?: boolean;
}

const DRAFT: FieldDef = {
	name: "draft",
	kind: "boolean",
	label: "Черновик",
	required: false,
	help: "Не публиковать на сайте. В dev виден с бейджем.",
};

const IMAGE: FieldDef = {
	name: "image",
	kind: "image",
	label: "Обложка",
	required: false,
	help: "Загрузить картинку — редактор приведёт её к 1200×630 и положит в static/images.",
};

const NEEDS_TRANSLATION: FieldDef = {
	name: "needs_translation",
	kind: "boolean",
	label: "Нужен перевод",
	required: false,
	auto: true,
	help: "Ставится кнопкой «Скопировать из RU». Убрать, когда переведёшь.",
};

const IS_MOCK: FieldDef = {
	name: "isMock",
	kind: "boolean",
	label: "Мок-контент",
	required: false,
	hidden: true,
};

const TAGS: FieldDef = {
	name: "tags",
	kind: "string[]",
	label: "Теги",
	required: false,
	help: "Через запятую. Регистр не важен.",
};

const TITLE: FieldDef = {
	name: "title",
	kind: "string",
	label: "Заголовок",
	required: true,
};

const DATE: FieldDef = {
	name: "date",
	kind: "date",
	label: "Дата",
	required: true,
	default: "today",
};

export const FIELDS: Record<ContentType, FieldDef[]> = {
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
			help: "Внешняя ссылка, если пост ведёт куда-то.",
		},
		DRAFT,
		NEEDS_TRANSLATION,
		IS_MOCK,
	],
	article: [TITLE, DATE, TAGS, IMAGE, DRAFT, NEEDS_TRANSLATION, IS_MOCK],
	project: [
		TITLE,
		{
			name: "subtitle",
			kind: "string",
			label: "Подзаголовок",
			required: false,
			help: "Короткая строка под названием, например «Rust · CLI».",
		},
		{
			name: "description",
			kind: "text",
			label: "Описание",
			required: true,
			help: "Одно-два предложения, по-русски.",
		},
		TAGS,
		IMAGE,
		{
			name: "repo",
			kind: "url",
			label: "Репозиторий",
			required: true,
			help: "https://github.com/owner/name",
		},
		{
			name: "homepage",
			kind: "url",
			label: "Демо",
			required: false,
			help: "Ссылка на живой пример.",
		},
		{
			name: "status",
			kind: "choice",
			label: "Статус",
			required: false,
			choices: ["raw", "ready", "need_review"],
			default: "ready",
		},
		{
			name: "order",
			kind: "number",
			label: "Порядок",
			required: false,
			help: "Число: меньше — выше на странице проектов. Без него порядок случайный.",
		},
		DRAFT,
		NEEDS_TRANSLATION,
		IS_MOCK,
	],
};

export function fieldNames(type: ContentType): string[] {
	return FIELDS[type].map((field) => field.name);
}

const DATE_LENGTH = 10;

/**
 * Значения по умолчанию строго из схемы. Нельзя сеять поля, которого в
 * `frontmatter.json` нет: у project, например, нет `date`, и линтер отвергнет
 * такой файл.
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
