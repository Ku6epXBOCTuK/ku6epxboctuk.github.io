import {
	FIELDS,
	type ContentType,
	type FieldDef,
} from "@ku6epxboctuk/content-core/shared";

export interface FieldGroup {
	title: string;
	fields: string[];
}

export interface ResolvedGroup {
	title: string;
	fields: FieldDef[];
}

export interface FieldRow {
	title?: string;
	shared?: FieldDef;
	ru?: FieldDef;
	en?: FieldDef;
}

interface Plan {
	shared: FieldGroup[];
	local: FieldGroup[];
	translated: FieldGroup[];
}

const PLAN: Record<ContentType, Plan> = {
	post: {
		shared: [
			{ title: "Публикация", fields: ["date", "link", "draft"] },
			{ title: "Темы", fields: ["tags"] },
		],
		local: [],
		translated: [
			{ title: "Заголовок", fields: ["title"] },
			{ title: "Картинка", fields: ["image"] },
		],
	},
	article: {
		shared: [
			{ title: "Публикация", fields: ["date", "draft"] },
			{ title: "Темы", fields: ["tags"] },
		],
		local: [],
		translated: [
			{ title: "Заголовок", fields: ["title"] },
			{ title: "Картинка", fields: ["image"] },
		],
	},
	project: {
		shared: [
			{ title: "Ссылки", fields: ["repo", "homepage"] },
			{ title: "Темы", fields: ["tags"] },
			{ title: "Порядок и статус", fields: ["status", "order", "draft"] },
		],
		local: [{ title: "Локальное — projects.local.json", fields: ["path"] }],
		translated: [
			{
				title: "Заголовок и описание",
				fields: ["title", "subtitle", "description"],
			},
			{ title: "Картинка", fields: ["image"] },
		],
	},
};

function resolve(plan: FieldGroup[], fields: FieldDef[]): ResolvedGroup[] {
	return plan
		.map((group) => ({
			title: group.title,
			fields: fields.filter((field) => group.fields.includes(field.name)),
		}))
		.filter((group) => group.fields.length > 0);
}

/**
 * План задаёт только порядок и заголовки блоков. В какой список попадёт поле,
 * решает `scope` у самого поля, а не место в плане.
 */
export function fieldRows(
	type: ContentType,
	ruFields: FieldDef[],
	enFields: FieldDef[],
): { shared: FieldRow[]; local: FieldRow[]; translated: FieldRow[] } {
	const plan = PLAN[type];
	const byName = (list: FieldDef[], name: string) =>
		list.find((field) => field.name === name);

	const offLang = FIELDS[type].filter(
		(field) => field.scope !== "translatable" && !field.hidden && !field.auto,
	);

	const union: FieldDef[] = [];
	for (const field of ruFields.concat(enFields).concat(offLang)) {
		if (!union.some((item) => item.name === field.name)) union.push(field);
	}

	const sharedRows: FieldRow[] = [];
	const localRows: FieldRow[] = [];
	const translatedRows: FieldRow[] = [];

	const emit = (group: ResolvedGroup) => {
		const isPair = group.fields.some((field) => field.scope === "translatable");
		const bucket = isPair
			? translatedRows
			: group.fields.some((field) => field.scope === "local")
				? localRows
				: sharedRows;
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
	for (const group of resolve(plan.local, union)) emit(group);
	for (const group of resolve(plan.translated, union)) emit(group);

	const claimed = new Set(
		plan.shared
			.flatMap((g) => g.fields)
			.concat(plan.local.flatMap((g) => g.fields))
			.concat(plan.translated.flatMap((g) => g.fields)),
	);
	const leftovers = union.filter(
		(field) => !claimed.has(field.name) && !field.hidden && !field.auto,
	);
	if (leftovers.length > 0) {
		emit({ title: "Прочее", fields: leftovers });
	}

	return { shared: sharedRows, local: localRows, translated: translatedRows };
}
