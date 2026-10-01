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

function unclaimed(
	plan: FieldGroup[],
	fields: FieldDef[],
	claimed: Set<string>,
): FieldDef[] {
	const listed = new Set(plan.flatMap((group) => group.fields));
	return fields.filter(
		(field) => !listed.has(field.name) && !claimed.has(field.name),
	);
}

/**
 * Разметка формы: общие поля сверху одним списком, переводимые ниже парами.
 *
 * `only`-поля в общий блок попадают: `path` есть только в RU, но он не переводится
 * и правится один раз. `only` при этом продолжает решать, в какой файл попадёт
 * значение, а `shared` — рисуется ли поле один раз или дважды.
 */
export function fieldRows(
	type: ContentType,
	ruFields: FieldDef[],
	enFields: FieldDef[],
): { shared: FieldRow[]; translated: FieldRow[] } {
	const plan = PLAN[type];
	const byName = (list: FieldDef[], name: string) =>
		list.find((field) => field.name === name);

	const sharedFields = FIELDS[type].filter(
		(field) => field.shared && !field.hidden && !field.auto,
	);

	// Порядок берём из объединения, по одному вхождению на поле: иначе поле,
	// общее у двух языков, попало бы в блок дважды.
	const union: FieldDef[] = [];
	for (const field of ruFields.concat(enFields).concat(sharedFields)) {
		if (!union.some((item) => item.name === field.name)) union.push(field);
	}

	const claimed = new Set(plan.shared.flatMap((g) => g.fields));

	const sharedRows: FieldRow[] = [];
	for (const group of resolve(plan.shared, union)) {
		sharedRows.push({ title: group.title });
		for (const field of group.fields) sharedRows.push({ shared: field });
	}

	// Новое поле в схеме не должно молча пропасть из формы.
	const leftovers = unclaimed(plan.translated, union, claimed).filter(
		(field) => !field.shared,
	);
	if (leftovers.length > 0) {
		sharedRows.push({ title: "Прочее" });
		for (const field of leftovers) sharedRows.push({ shared: field });
	}

	const translatedRows: FieldRow[] = [];
	for (const group of resolve(plan.translated, union)) {
		translatedRows.push({ title: group.title });
		for (const field of group.fields) {
			const name = field.name;
			translatedRows.push({
				ru: byName(ruFields, name),
				en: byName(enFields, name),
			});
		}
	}

	return { shared: sharedRows, translated: translatedRows };
}
