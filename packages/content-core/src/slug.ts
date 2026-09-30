const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SLUG_PATTERN = "[a-z0-9]+(-[a-z0-9]+)*";

export function isValidSlug(slug: string): boolean {
	return SLUG_RE.test(slug);
}

export function slugFromTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/ё/g, "е")
		.replace(/[^a-z0-9а-я]+/g, "-")
		.replace(/[а-я]/g, (letter) => TRANSLIT[letter] ?? "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

const TRANSLIT: Record<string, string> = {
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ж: "zh",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	х: "h",
	ц: "ts",
	ч: "ch",
	ш: "sh",
	щ: "sch",
	ъ: "",
	ы: "y",
	ь: "",
	э: "e",
	ю: "yu",
	я: "ya",
};
