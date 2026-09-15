import type { ContentLang } from "$lib/content";

const en = {
	nav: {
		home: "home",
		posts: "posts",
		articles: "articles",
		projects: "projects",
		weekly: "weekly",
	},
	footer: {
		note: "built with attention to detail",
		code: "© 2026 / system.online",
	},
	draft: "draft",
	readIn: "read in english",
	minRead: "min read",
	project: {
		repo: "sources",
		demo: "demo",
	},
	home: {
		eyebrow: "✦ personal dev log · 2026",
		titleTop: "Hi, I'm Ku6epXBOCTuK.",
		titleEm: "Writing code",
		titleMid: " and growing",
		titleBottom: "small digital gardens.",
		intro:
			"Personal blog about development, interface design, open source, and attempts to make the internet a little kinder.",
		primary: "read the feed",
		ghost: "view projects",
		sectionEyebrow: "short thoughts",
		sectionTitle: "Recent posts",
		sectionLink: "all posts →",
		terminal: {
			whoami: "creative developer",
			mood: "soft focus",
			playing: "building in public",
		},
	},
};

type UI = typeof en;

const ru: UI = {
	nav: {
		home: "главная",
		posts: "посты",
		articles: "статьи",
		projects: "проекты",
		weekly: "недельники",
	},
	footer: {
		note: "сделано с вниманием к деталям",
		code: "© 2026 / system.online",
	},
	draft: "черновик",
	readIn: "читать на русском",
	minRead: "мин чтения",
	project: {
		repo: "исходники",
		demo: "демо",
	},
	home: {
		eyebrow: "✦ личный девлог · 2026",
		titleTop: "Привет, я Ku6epXBOCTuK.",
		titleEm: "Пишу код",
		titleMid: " и выращиваю",
		titleBottom: "маленькие цифровые сады.",
		intro:
			"Личный блог о разработке, дизайне интерфейсов, опенсорсе и попытках сделать интернет чуть добрее.",
		primary: "читать блог",
		ghost: "смотреть проекты",
		sectionEyebrow: "короткие мысли",
		sectionTitle: "Последние посты",
		sectionLink: "все посты →",
		terminal: {
			whoami: "креативный разработчик",
			mood: "мягкая концентрация",
			playing: "делаю в открытую",
		},
	},
};

export type UIStrings = UI;

export function ui(lang: ContentLang): UI {
	return lang === "en" ? en : ru;
}
