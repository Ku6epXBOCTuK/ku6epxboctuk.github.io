import {
	FIELDS,
	type ContentType,
	type FieldDef,
} from "@ku6epxboctuk/content-core/shared";

/**
 * Поля разложены по блокам, и блоки не смешивают переводимое с общим.
 *
 * Смешивать нельзя: заголовок блока говорит, как читается то, что под ним, а
 * в блоке «Темы и обложка» обложка переводится, а теги нет. Такое название
 * врёт половину содержимого.
 *
 * Порядок в форме: сначала общие поля, потом переводимые. Общие одинаковы у
 * обоих языков и их правишь один раз, поэтому логично, что они сверху и не
 * перемежаются колонками.
 *
 * Это забота редактора, а не схемы контента: в `frontmatter.json` порядок полей
 * не меняется, здесь он только для показа.
 */
export interface FieldGroup {
	title: string;
	fields: string[];
}

/** Блок после подстановки: `fields` уже отфильтрованы по наличию в схеме. */
export interface ResolvedGroup {
	title: string;
	fields: FieldDef[];
}

/**
 * Строка формы: слева поле одного языка, справа его же из другого.
 *
 * Порядок строк один на оба языка, иначе «теги» RU оказались бы напротив
 * «ссылки» EN и сравнивать перевод пришлось бы глазами по всей форме.
 */
export interface FieldRow {
	/** Заголовок блока. Строка с ним — разделитель, полей не несёт. */
	title?: string;
	/** Общее поле: рисуется один раз, без колонки напротив. */
	shared?: FieldDef;
	ru?: FieldDef;
	en?: FieldDef;
}

interface Plan {
	shared: FieldGroup[];
	translated: FieldGroup[];
}

const PLAN: Record<ContentType, Plan> = {
	post: {
		shared: [
			{ title: "Публикация", fields: ["date", "link", "draft"] },
			{ title: "Темы", fields: ["tags"] },
		],
		translated: [
			{ title: "Заголовок", fields: ["title"] },
			// Не «Обложка»: под блоком и так стоит поле с этой подписью, и два
			// одинаковых слова подряд читаются как сбой вёрстки.
			{ title: "Картинка", fields: ["image"] },
		],
	},
	article: {
		shared: [
			{ title: "Публикация", fields: ["date", "draft"] },
			{ title: "Темы", fields: ["tags"] },
		],
		translated: [
			{ title: "Заголовок", fields: ["title"] },
			{ title: "Картинка", fields: ["image"] },
		],
	},
	project: {
		shared: [
			{ title: "Ссылки", fields: ["repo", "homepage", "path"] },
			{ title: "Темы", fields: ["tags"] },
			{ title: "Порядок и статус", fields: ["status", "order", "draft"] },
		],
		translated: [
			{
				title: "Заголовок и описание",
				fields: ["title", "subtitle", "description"],
			},
			{ title: "Картинка", fields: ["image"] },
		],
	},
};

/** Поля блока в порядке плана, без пропавших и лишних. */
function resolve(plan: FieldGroup[], fields: FieldDef[]): ResolvedGroup[] {
	return plan
		.map((group) => ({
			title: group.title,
			fields: fields.filter((field) => group.fields.includes(field.name)),
		}))
		.filter((group) => group.fields.length > 0);
}

/**
 * Разметка формы: общие поля сверху одним списком, переводимые ниже парами.
 *
 * План ниже задаёт только порядок и заголовки блоков. В какой список попадёт
 * поле, решает `scope` у самого поля, а не место в плане: иначе `image` из блока
 * «Картинка» нарисовался бы парой с двумя пустыми ячейками, а новое поле из
 * `fields.ts` уехало бы в общий блок с ложной подписью.
 */
export function fieldRows(
	type: ContentType,
	ruFields: FieldDef[],
	enFields: FieldDef[],
): { shared: FieldRow[]; translated: FieldRow[] } {
	const plan = PLAN[type];
	const byName = (list: FieldDef[], name: string) =>
		list.find((field) => field.name === name);

	// Общие и локальные поля вызывающий не передаёт, они живут вне языковых
	// колонок. Добираем из схемы, иначе они не попадут ни в одну строку.
	const offLang = FIELDS[type].filter(
		(field) => field.scope !== "translatable" && !field.hidden && !field.auto,
	);

	const union: FieldDef[] = [];
	for (const field of ruFields.concat(enFields).concat(offLang)) {
		if (!union.some((item) => item.name === field.name)) union.push(field);
	}

	const sharedRows: FieldRow[] = [];
	const translatedRows: FieldRow[] = [];

	const emit = (group: ResolvedGroup) => {
		const isPair = group.fields.some((field) => field.scope === "translatable");
		const bucket = isPair ? translatedRows : sharedRows;
		const title = { title: group.title };
		const rows = group.fields.map((field) =>
			field.scope === "translatable"
				? {
						ru: byName(ruFields, field.name),
						en: byName(enFields, field.name),
					}
				: { shared: field },
		);
		bucket.push(title, ...rows);
	};

	for (const group of resolve(plan.shared, union)) emit(group);
	for (const group of resolve(plan.translated, union)) emit(group);

	// Новое поле в схеме не должно молча пропасть из формы.
	const claimed = new Set(
		plan.shared
			.flatMap((g) => g.fields)
			.concat(plan.translated.flatMap((g) => g.fields)),
	);
	const leftovers = union.filter(
		(field) => !claimed.has(field.name) && !field.hidden && !field.auto,
	);
	if (leftovers.length > 0) {
		emit({ title: "Прочее", fields: leftovers });
	}

	return { shared: sharedRows, translated: translatedRows };
}
