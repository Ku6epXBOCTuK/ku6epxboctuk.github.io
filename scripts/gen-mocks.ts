import * as fs from "node:fs";
import * as path from "node:path";

interface PostMock {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	body: string;
	link?: string;
}

interface ArticleMock {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	intro: string;
	body: string;
}

interface ProjectMock {
	slug: string;
	title: string;
	subtitle: string;
	description: string;
	tags: string[];
	repo: string;
	demo?: string;
	icon: string;
	color: string;
	status: string;
}

interface WeeklyMock {
	slug: string;
	title: string;
	date: string;
	week: string;
	excerpt: string;
	changes: string[];
}

const posts: PostMock[] = [
	{
		slug: "z-index-battle",
		title: "победила баг с z-index",
		date: "2026-09-12",
		tags: ["css", "будни"],
		body: "Два часа отладки, а спас один трюк со стековым контекстом. Если элемент не перекрывается как надо — проверь, какой stacking context построил родитель.",
	},
	{
		slug: "added-dark-theme",
		title: "добавила тёмную тему в проект",
		date: "2026-09-04",
		tags: ["дизайн", "код"],
		body: "Ночное кодирование требует бережного отношения к глазам. Токены на oklch переключаются одной переменной — никаких блуждающих хардкод-цветов.",
	},
	{
		slug: "from-react-to-svelte",
		title: "переход с react на svelte: честные заметки",
		date: "2026-08-20",
		tags: ["svelte", "рефлексия"],
		body: "Первый месяц на новом фреймворке. Реактивность из коробки, меньше бойлерплейта, но миграция стора и экосистемы — не нулевая.",
		link: "https://svelte.dev",
	},
	{
		slug: "terminal-widget-progress",
		title: "терминальный виджет на главной: как и зачем",
		date: "2026-08-11",
		tags: ["сайт"],
		body: "Показывает настроение и статус. Без бэкенда — просто данные в компоненте, но ощущение «живого» сайта появилось.",
	},
	{
		slug: "reading-time-static",
		title: "время чтения на статическом сайте",
		date: "2026-07-28",
		tags: ["svelte", "идея"],
		body: "Считается из raw-тела при сборке: слова / 200. Никаких полей во frontmatter, никакого дублирования.",
	},
	{
		slug: "one-week-of-rust",
		title: "неделя с rust: итоги",
		date: "2026-07-15",
		tags: ["rust"],
		body: "Борроу-чекер по-прежнему ругается, но уже реже. Больше всего удивил пакетный менеджер — ничего не «сломалось».",
	},
	{
		slug: "pomodoro-trail",
		title: "помидорка со следами: заметка-черновик",
		date: "2026-09-14",
		tags: ["таски", "эксперимент"],
		draft: true,
		body: "Идея: таймер показывает «след» прошлых сессий на трее — сколько минут уже накоплено за неделю.",
	},
];

const articles: ArticleMock[] = [
	{
		slug: "ecs-architecture",
		title: "Разбираем ECS на примере браузерной игры",
		date: "2026-09-10",
		tags: ["gamedev", "engineering"],
		intro:
			"Entity Component System — архитектура, где данные отделены от поведения. Разбираю на примере маленькой браузерной игры, с картинками и выводами.",
		body: "## Почему ECS\n\nКлассическая иерархия классов умирает, когда у сущности много вариативных поведений. ECS раскладывает всё на компоненты-данные и системы-поведение.\n\n## Компоненты\n\nКомпонент — обычная структура без методов: позиция, скорость, здоровье.\n\n## Системы\n\nСистема обрабатывает наборы компонентов: движение, столкновения, отрисовка. Каждая новая функция — новая система, а не новый класс-потомок.",
	},
	{
		slug: "weekly-reports-manual",
		title: "Зачем личному сайту еженедельные отчёты",
		date: "2026-08-24",
		tags: ["мета", "автоматизация"],
		intro: "Автогенерация отчётов из git-логов делает сайт живым без усилий.",
		body: "## Идея\n\nГенератор читает git-историю проектов и собирает сводку за неделю: какие коммиты, в каких проектах.\n\n## Формат\n\nОдна карточка — список «проект → изменения», разделитель тоньше волоса.\n\n## Итог\n\nСайт обновляется сам, а читатель видит движение даже в тихие недели.",
	},
	{
		slug: "oklch-tokens",
		title: "OKLCH и четыре набора токенов",
		date: "2026-08-06",
		tags: ["css", "дизайн"],
		intro:
			"Одна палитра, два скина, два режима — как уложить это в CSS-переменные без хаоса.",
		body: "## Почему OKLCH\n\nЧеловекочитаемая модель цвета с независимой светлотой. Тёмная тема пересчитывается без «болезненных» хексов.\n\n## Матрица 2×2\n\nСкин × режим = четыре набора переменных на одном корне. Переключение — атрибут и класс, без FOUC.\n\n## Вывод\n\nВсе цвета живут в `src/app.css`. В компонентах — только `var(--token)`.",
	},
	{
		slug: "kawaii-os-design",
		title: "Kawaii-стиль: жёсткие тени и пастель",
		date: "2026-07-22",
		tags: ["дизайн", "ui"],
		intro:
			"Милые «окошки» с тайтлбарами, 3px-тени без размытия, пастель. Почему это работает и не выглядит детским.",
		body: "## Приметы стиля\n\nКарточки-«окошки» с градиентной обводкой, жёсткие тени, скругления 14px.\n\n## Почему мило\n\nВлажные тени и округлости вызывают позитивный отклик; статус-бар и точки делают интерфейс «системным».\n\n## Где грань\n\nАкцент — дозированно. Одна яркая деталь на секцию, остальное — приглушено.",
	},
	{
		slug: "git-hooks-that-save",
		title: "Git-хуки, которые ловят проблемы до пуша",
		date: "2026-07-08",
		tags: ["git", "автоматизация"],
		intro:
			"Форматтер, линтер и проверка сообщений коммитов — три хука вместо утренней рутины ревью.",
		body: "## pre-commit\n\nФормат и лёгкий линт только изменённых файлов.\n\n## commit-msg\n\nКонвенция сообщений: тип + модуль. Опечатка — коммит отклонён.\n\n## pre-push\n\nПолный check. Если сломалось на last device — пуш не уйдёт.",
	},
	{
		slug: "static-site-speed",
		title: "Статический сайт на GitHub Pages",
		date: "2026-06-25",
		tags: ["svelte", "infra"],
		intro:
			"Сборка, деплой и скорость: что реально важно для личного сайта без бэкенда.",
		body: "## Сборка\n\nSvelteKit в режиме static-pages, всё дерево контента — в eager-глобах при сборке.\n\n## Деплой\n\nGitHub Actions пушит в ветку pages. Триггер — по изменению контента.\n\n## Скорость\n\nНоль бандла JS на листингах, шрифты оффлайн через @fontsource.",
	},
];

const projects: ProjectMock[] = [
	{
		slug: "now-playing",
		title: "now-playing",
		subtitle: "obs browser source",
		description:
			"obs browser source виджет, который показывает трек, играющий прямо сейчас.",
		tags: ["html", "css", "obs"],
		repo: "https://github.com/Ku6epXBOCTuK/now_playing",
		demo: "https://ku6epxboctuk.github.io/now_playing",
		icon: "◈",
		color: "coral",
		status: "active",
	},
	{
		slug: "git-overhooks",
		title: "git-overhooks",
		subtitle: "набор git-хуков",
		description:
			"Хуки, которые ловят проблемы до пуша, а не после ревью: формат, конвенции сообщений, полный check в pre-push.",
		tags: ["shell", "git"],
		repo: "https://github.com/Ku6epXBOCTuK/git_overhooks",
		icon: "▦",
		color: "periwinkle",
		status: "maintained",
	},
	{
		slug: "focus-garden",
		title: "focus-garden",
		subtitle: "tray-помидорка",
		description:
			"Фокуc-таймер в системном трее: сессии, статистика и мягкие напоминания. Приложение на tauri.",
		tags: ["svelte", "tauri", "rust"],
		repo: "https://github.com/Ku6epXBOCTuK/focus_garden",
		icon: "✿",
		color: "sky",
		status: "active",
	},
	{
		slug: "mochi-ui",
		title: "mochi-ui",
		subtitle: "ui kit на svelte",
		description:
			"Дизайн-система из карточек-«окошек», чипов и жёстких теней. Токены на oklch, 4 темы.",
		tags: ["svelte", "design-system"],
		repo: "https://github.com/Ku6epXBOCTuK/mochi_ui",
		icon: "◌",
		color: "periwinkle",
		status: "maintained",
	},
	{
		slug: "cat-signal",
		title: "cat-signal",
		subtitle: "уведомления",
		description:
			"Маленький сервис, который присылает уведомления, когда питомец прошёл мимо датчика.",
		tags: ["fun", "ts"],
		repo: "https://github.com/Ku6epXBOCTuK/cat_signal",
		icon: "🐾",
		color: "coral",
		status: "archived",
	},
	{
		slug: "mica-notepad",
		title: "mica-notepad",
		subtitle: "заметки с акцентом",
		description:
			"Быстрый блокнот с markdown, тегами и локальным полнотекстовым поиском. Rust + tauri.",
		tags: ["rust", "tauri", "notes"],
		repo: "https://github.com/Ku6epXBOCTuK/mica_notepad",
		icon: "❒",
		color: "sky",
		status: "active",
	},
];

const weekly: WeeklyMock[] = [
	{
		slug: "2026-09-14",
		title: "weekly 2026-W38",
		date: "2026-09-14",
		week: "W38",
		excerpt: "now-playing v1.2, git-overhooks: hooks api.",
		changes: [
			[
				"now-playing",
				"feat(overlay): blur за панелью · fix(timer): дрейф таймзоны",
			],
			[
				"web-site",
				"карточки для всех типов контента · главная: последние посты",
			],
			["mochi-ui", "docs: примеры токенов в readme"],
		],
	},
	{
		slug: "2026-09-07",
		title: "weekly 2026-W37",
		date: "2026-09-07",
		week: "W37",
		excerpt: "3 проекта, 28 коммитов. focus-garden: первая собранная версия.",
		changes: [
			["focus-garden", "feat: pomodoro-таймер · fix: трей-иконка на линуксе"],
			["web-site", "контент-модель: 4 типа · визард для постов и статей"],
			["cat-signal", "refactor: вынесены типы датчика"],
		],
	},
	{
		slug: "2026-08-31",
		title: "weekly 2026-W36",
		date: "2026-08-31",
		week: "W36",
		excerpt: "дизайн-система: токены на oklch, два скина.",
		changes: [
			["mochi-ui", "feat: токены oklch · feat: тёмная тема"],
			["web-site", "дизайн: 4 набора переменных · редизайн topbar"],
		],
	},
	{
		slug: "2026-08-24",
		title: "weekly 2026-W35",
		date: "2026-08-24",
		week: "W35",
		excerpt: "git-overhooks: v0.9, hooks api v2.",
		changes: [
			["git-overhooks", "feat: hooks api v2 · docs: примеры в readme"],
			["web-site", "роуты /articles · линтер контента"],
		],
	},
	{
		slug: "2026-08-17",
		title: "weekly 2026-W34",
		date: "2026-08-17",
		week: "W34",
		excerpt: "now-playing: релиз-кандидат, obs-шрифты.",
		changes: [
			["now-playing", "feat: настройка шрифта через панель · fix: null-трек"],
			["mica-notepad", "feat: полнотекстовый поиск"],
		],
	},
	{
		slug: "2026-08-10",
		title: "weekly 2026-W33",
		date: "2026-08-10",
		week: "W33",
		excerpt: "неделя планирования и экспериментов.",
		changes: [
			["web-site", "план дизайна · план контент-модели"],
			["focus-garden", "spike: tray + window на tauri"],
		],
	},
];

function yamlStr(value: string): string {
	return /[:#[\]{},&*!|>'"%@`]/.test(value) ? JSON.stringify(value) : value;
}

function frontmatter(fields: Array<[string, unknown]>): string {
	const lines = fields
		.map(([key, value]) => present(key, value))
		.filter(Boolean);
	return `---\n${lines.join("\n")}\n---`;
}

function present(key: string, value: unknown): string {
	if (value === undefined || value === null) return "";
	if (typeof value === "boolean") return `${key}: ${value}`;
	if (Array.isArray(value)) {
		if (value.length === 0) return "";
		const tags = value as string[];
		return `${key}:\n${tags.map((t) => `  - ${yamlStr(t)}`).join("\n")}`;
	}
	return `${key}: ${yamlStr(String(value))}`;
}

function write(dir: string, file: string, content: string): void {
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, file), content + "\n", "utf8");
}

function writePost(p: PostMock, lang: "ru" | "en"): void {
	const dir = path.join("src/content/posts", p.slug);
	const fields: Array<[string, unknown]> = [
		["title", p.title],
		["date", p.date],
		["tags", p.tags],
	];
	if (p.link) fields.push(["link", p.link]);
	fields.push(["draft", true]);
	if (lang === "en") fields.push(["needs_translation", true]);
	const body = lang === "en" ? "перевод в работе." : p.body;
	write(dir, `index.${lang}.md`, `${frontmatter(fields)}\n${body}`);
}

function writeArticle(a: ArticleMock, lang: "ru" | "en"): void {
	const dir = path.join("src/content/articles", a.slug);
	const fields: Array<[string, unknown]> = [
		["title", a.title],
		["date", a.date],
		["tags", a.tags],
	];
	fields.push(["draft", true]);
	if (lang === "en") fields.push(["needs_translation", true]);
	const body =
		lang === "en"
			? "перевод в работе.\n\n<!--more-->"
			: `${a.intro}\n\n<!--more-->\n\n${a.body}`;
	write(dir, `index.${lang}.md`, `${frontmatter(fields)}\n${body}`);
}

function writeProject(p: ProjectMock): void {
	const dir = path.join("src/content/projects", p.slug);
	const fields: Array<[string, unknown]> = [
		["title", p.title],
		["subtitle", p.subtitle],
		["description", p.description],
		["tags", p.tags],
		["repo", p.repo],
	];
	if (p.demo) fields.push(["demo", p.demo]);
	fields.push(
		["icon", p.icon],
		["color", p.color],
		["status", p.status],
		["draft", true],
	);
	write(dir, "index.ru.md", `${frontmatter(fields)}\n`);
}

function writeWeekly(w: WeeklyMock): void {
	const dir = path.join("src/content/weekly", w.slug);
	const fields: Array<[string, unknown]> = [
		["title", w.title],
		["date", w.date],
		["excerpt", w.excerpt],
		["generated", true],
		["generated_at", `${w.date}T10:00:00Z`],
		["draft", true],
	];
	const rows = w.changes
		.map(([project, changes]) => `- **${project}** — ${changes}`)
		.join("\n");
	write(dir, "index.ru.md", `${frontmatter(fields)}\n${rows}`);
}

for (const p of posts) {
	writePost(p, "ru");
	writePost(p, "en");
}
for (const a of articles) {
	writeArticle(a, "ru");
	writeArticle(a, "en");
}
for (const p of projects) writeProject(p);
for (const w of weekly) writeWeekly(w);

console.log(
	"mocks:",
	posts.length * 2 + articles.length * 2 + projects.length + weekly.length,
	"files",
);
