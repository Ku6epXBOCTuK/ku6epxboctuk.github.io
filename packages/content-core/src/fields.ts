import type { ContentLang, ContentType } from "./types.ts";

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
	/** Поле принадлежит одному языку, в остальных скрыто и при сохранении
	 * вычищается. Для фактов о машине вроде `path`, а не о переводе. */
	only?: ContentLang;
	/**
	 * Поле не переводится и одинаково у всех языков: теги, ссылки, обложка,
	 * статус, порядок. Редактор правит его один раз и пишет одинаково в оба
	 * файла, иначе они молча разъедутся, а расхождение заметит только
	 * сравнение двух файлов глазами.
	 */
	shared?: boolean;
}

const DRAFT: FieldDef = {
	name: "draft",
	kind: "boolean",
	label: "Черновик",
	required: false,
	shared: true,
};

const IMAGE: FieldDef = {
	name: "image",
	kind: "image",
	label: "Обложка",
	required: false,
	// Обложка может отличаться: у проекта баннер на главной и на странице
	// проекта — разные картинки, см. ответ пользователя.
	shared: false,
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
	shared: true,
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
	shared: true,
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
			shared: true,
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
		},
		{
			name: "description",
			kind: "text",
			label: "Описание",
			required: true,
		},
		TAGS,
		IMAGE,
		{
			name: "repo",
			kind: "url",
			label: "Репозиторий",
			required: true,
			shared: true,
		},
		{
			name: "path",
			kind: "string",
			label: "Локальная папка",
			required: false,
			only: "ru",
			// Правится один раз, но пишется только в RU: `only` важнее `shared`
			// при сохранении. В форме это общий блок — рядом с переводимыми полями
			// пустое место выглядело бы как потерянный блок.
			shared: true,
			help: "Путь к клону относительно корня сайта, например ../brul. Нужен weekly, чтобы собрать git-логи.",
		},
		{
			name: "homepage",
			kind: "url",
			label: "Демо",
			required: false,
			shared: true,
		},
		{
			name: "status",
			kind: "choice",
			label: "Статус",
			required: false,
			choices: ["raw", "ready", "need_review"],
			default: "ready",
			shared: true,
		},
		{
			name: "order",
			kind: "number",
			label: "Порядок",
			required: false,
			shared: true,
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
