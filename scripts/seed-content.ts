import {
	emptyEntry,
	saveEntry,
	type EntryInput,
} from "@ku6epxboctuk/content-core";

type LangVersion = { frontmatter: Record<string, unknown>; body: string };

function unit(
	type: "post" | "article" | "project",
	slug: string,
	shared: Record<string, unknown>,
	ru: LangVersion,
	en: LangVersion,
): EntryInput {
	const entry = emptyEntry(type, slug);
	entry.shared = shared as never;
	entry.versions.ru = ru as never;
	entry.versions.en = en as never;
	return entry;
}

const GH = "https://github.com/Ku6epXBOCTuK";

interface ProjectSeed {
	slug: string;
	repo: string;
	ru: string;
	en: string;
	tags: string[];
	status?: string;
	order?: number;
	icon?: string;
	color?: string;
}

const PROJECTS: ProjectSeed[] = [
	{
		slug: "easy-png-tools",
		repo: "easy-png-tools",
		ru: "Утилиты для работы с картинками — бесплатный аналог onlinepngtools.",
		en: "Image utilities — a free alternative to onlinepngtools.",
		tags: ["typescript", "tools"],
		order: 1,
		icon: "✦",
		color: "coral",
	},
	{
		slug: "twitch-panels",
		repo: "twitch-panels",
		ru: "Генератор панелей для Twitch-канала: Svelte 5, Konva.js, тёмная и светлая темы, экспорт в PNG и ZIP.",
		en: "Panel generator for Twitch channels: Svelte 5, Konva.js, dark/light theme, PNG/ZIP export.",
		tags: ["twitch", "svelte"],
		order: 2,
		icon: "▦",
		color: "periwinkle",
	},
	{
		slug: "css-matrix-calc",
		repo: "css-matrix-calc",
		ru: "Калькулятор CSS-искажений matrix3d() с perspective: двигаешь точки — получаешь готовый CSS.",
		en: "CSS matrix3d() perspective calculator: drag the points, get ready-to-use CSS.",
		tags: ["css", "tools"],
		order: 3,
		icon: "◈",
		color: "sky",
	},
	{
		slug: "shooting-word",
		repo: "shooting-word-html",
		ru: "Интерактивная игра для Twitch-чата: волны, боссы, таблица лидеров. Работает как OBS Browser Source.",
		en: "Interactive Twitch chat game: waves, bosses, leaderboard. Runs as an OBS Browser Source.",
		tags: ["twitch", "game", "obs"],
		order: 4,
		icon: "▲",
		color: "coral",
	},
	{
		slug: "now-playing",
		repo: "now_playing",
		ru: "Минималистичный OBS-виджет с текущим треком из AIMP, Foobar2000 или MusicBee. Один HTML-файл.",
		en: "Minimal OBS widget showing the current track from AIMP/Foobar2000/MusicBee. A single HTML file.",
		tags: ["obs", "widget"],
		order: 5,
		icon: "●",
		color: "periwinkle",
	},
	{
		slug: "xboct-page",
		repo: "XBOCT-page",
		ru: "Стартовая страница браузера с управлением закладками: Svelte 5, TypeScript, Chrome Extension.",
		en: "Browser start page with bookmark management: Svelte 5, TypeScript, Chrome Extension.",
		tags: ["svelte", "extension"],
		order: 6,
		icon: "❒",
		color: "sky",
	},
	{
		slug: "itd",
		repo: "itd",
		ru: "Idle Tower Defence — игра на Three.js, miniplex и Svelte. В разработке.",
		en: "Idle Tower Defence — a game built with Three.js, miniplex and Svelte. Work in progress.",
		tags: ["game", "threejs"],
		status: "raw",
		order: 7,
		icon: "⬡",
		color: "coral",
	},
	{
		slug: "twitch-doc-panel",
		repo: "twitch-doc-panel",
		ru: "Инфо-панель для Twitch-канала на несколько страниц: markdown-файлы с картинками, правилами, списками и ссылками.",
		en: "Multi-page info panel for a Twitch channel: markdown files with images, rules, lists and links.",
		tags: ["twitch", "markdown"],
		order: 8,
		icon: "◇",
		color: "periwinkle",
	},
	{
		slug: "twitch-announce-telegram-bot",
		repo: "twitch-announce-telegram-bot",
		ru: "Бот, который анонсирует начало стрима в Telegram-канал.",
		en: "A bot that announces stream start in a Telegram channel.",
		tags: ["twitch", "telegram", "bot"],
	},
	{
		slug: "github-support-sla-monitor",
		repo: "github-support-sla-monitor",
		ru: "Мониторинг того, как быстро GitHub Support отвечает людям.",
		en: "Monitoring how fast GitHub Support responds to people.",
		tags: ["github", "monitoring"],
	},
	{
		slug: "xboct-deploy",
		repo: "xboct-deploy",
		ru: "Набор утилит для автоматизации деплоя приложений на VPS.",
		en: "A set of tools for automating app deployment to a VPS.",
		tags: ["rust", "devops"],
	},
	{
		slug: "git-overhooks",
		repo: "git-overhooks",
		ru: "Менеджер git-хуков на Rust.",
		en: "A git hooks manager written in Rust.",
		tags: ["rust", "git"],
	},
	{
		slug: "tray-run",
		repo: "tray-run",
		ru: "Запуск приложений из системного трея.",
		en: "Launch applications from the system tray.",
		tags: ["rust"],
	},
	{
		slug: "updater",
		repo: "updater",
		ru: "Автообновлятор для приложений на Rust.",
		en: "An auto-updater for applications, written in Rust.",
		tags: ["rust"],
	},
	{
		slug: "tg-bot",
		repo: "tg-bot",
		ru: "Telegram-бот на Rust.",
		en: "A Telegram bot written in Rust.",
		tags: ["rust", "telegram", "bot"],
	},
	{
		slug: "brul",
		repo: "brul",
		ru: "Утилита на Rust.",
		en: "A Rust utility.",
		tags: ["rust"],
	},
	{
		slug: "bropicker",
		repo: "bropicker",
		ru: "GUI-утилита на Slint (Rust).",
		en: "A GUI utility built with Slint (Rust).",
		tags: ["rust", "slint"],
	},
	{
		slug: "idle-chat-game",
		repo: "idle-chat-game",
		ru: "Idle-игра для Twitch-чата.",
		en: "An idle game for Twitch chat.",
		tags: ["twitch", "game"],
	},
	{
		slug: "twitch-cafe",
		repo: "twitch-cafe",
		ru: "Проект для Twitch-стрима.",
		en: "A project for a Twitch stream.",
		tags: ["twitch"],
	},
	{
		slug: "twitch-edge-tts",
		repo: "twitch-edge-tts",
		ru: "Озвучка Twitch-чата через Microsoft Edge TTS.",
		en: "Twitch chat text-to-speech via Microsoft Edge TTS.",
		tags: ["twitch", "tts"],
	},
	{
		slug: "xboct-chat",
		repo: "XBOCT-chat",
		ru: "Кастомный чат для стрима.",
		en: "A custom chat overlay for a stream.",
		tags: ["twitch", "obs"],
	},
	{
		slug: "rubber-duck",
		repo: "rubber-duck",
		ru: "Виртуальная резиновая уточка.",
		en: "A virtual rubber duck.",
		tags: ["typescript"],
	},
	{
		slug: "multi-widget",
		repo: "multi-widget",
		ru: "Несколько OBS-виджетов в одном HTML-файле.",
		en: "Several OBS widgets in a single HTML file.",
		tags: ["obs", "widget"],
	},
	{
		slug: "rock-roll-puzzle",
		repo: "rock-roll-puzzle",
		ru: "Пазл-игра на TypeScript.",
		en: "A puzzle game written in TypeScript.",
		tags: ["game"],
	},
	{
		slug: "pizdudes",
		repo: "pizdudes",
		ru: "Эксперимент на TypeScript.",
		en: "A TypeScript experiment.",
		tags: ["typescript"],
	},
	{
		slug: "effect-ts-practice",
		repo: "effect-ts-practice",
		ru: "Практика Effect-TS.",
		en: "Effect-TS practice.",
		tags: ["typescript", "effect"],
	},
	{
		slug: "eye-candy",
		repo: "eye-candy",
		ru: "Визуальные эксперименты.",
		en: "Visual experiments.",
		tags: ["css"],
	},
	{
		slug: "bun-dce-poc",
		repo: "bun-dce-poc",
		ru: "POC: dead code elimination в Bun.",
		en: "POC: dead code elimination in Bun.",
		tags: ["bun", "poc"],
	},
	{
		slug: "vite-poc",
		repo: "vite-poc",
		ru: "POC для Vite.",
		en: "A POC for Vite.",
		tags: ["vite", "poc"],
	},
	{
		slug: "weekly-report",
		repo: "weekly_report",
		ru: "Генератор еженедельных отчётов.",
		en: "A weekly report generator.",
		tags: ["typescript"],
	},
	{
		slug: "x-fantasy-console",
		repo: "x-fantasy-console",
		ru: "Эксперимент: собственная фэнтези-консоль.",
		en: "An experiment: my own fantasy console.",
		tags: ["game"],
	},
	{
		slug: "lopata",
		repo: "lopata",
		ru: "Сайт на Astro.",
		en: "A website built with Astro.",
		tags: ["astro", "website"],
	},
	{
		slug: "v-domike",
		repo: "v-domike",
		ru: "Сайт на Svelte.",
		en: "A website built with Svelte.",
		tags: ["svelte", "website"],
	},
	{
		slug: "sveltekit-template",
		repo: "sveltekit-template",
		ru: "Мой шаблон SvelteKit.",
		en: "My SvelteKit template.",
		tags: ["svelte", "template"],
	},
	{
		slug: "ku6epxboctuk-github-io",
		repo: "ku6epxboctuk.github.io",
		ru: "Этот сайт.",
		en: "This website.",
		tags: ["svelte", "website"],
	},
];

interface PostSeed {
	slug: string;
	date: string;
	link?: string;
	ruTitle: string;
	enTitle: string;
	ruBody: string;
	enBody: string;
	tags: string[];
}

const POSTS: PostSeed[] = [
	{
		slug: "statya-anatomiya-blokirovki",
		date: "2026-07-24",
		link: "https://dev.to/ku6epxboctuk/anatomy-of-a-ban-why-login-with-github-is-the-biggest-architectural-mistake-of-your-life-1715",
		ruTitle: "Выложила статью про блокировку GitHub",
		enTitle: "Published an article about my GitHub ban",
		ruBody:
			"Написала большую статью о том, как GitHub заблокировал мой аккаунт без объяснений и утащил за собой все сервисы, куда я заходила через GitHub OAuth. Русская версия — на vc.ru, английская — на dev.to.",
		enBody:
			"I wrote a long article about how GitHub suspended my account without explanation and took down every service I logged into via GitHub OAuth. English version is on dev.to, Russian — on vc.ru.",
		tags: ["github"],
	},
	{
		slug: "zavela-sait",
		date: "2026-10-05",
		link: `${GH}/ku6epxboctuk.github.io`,
		ruTitle: "Завела этот сайт",
		enTitle: "Started this website",
		ruBody:
			"Наконец-то собрала личный сайт: проекты, статьи, посты и автоматические недельники из git-логов. SvelteKit, статика, GitHub Pages.",
		enBody:
			"Finally put together a personal website: projects, articles, posts and automatic weekly digests from git logs. SvelteKit, static build, GitHub Pages.",
		tags: ["svelte", "website"],
	},
	{
		slug: "sozdala-bropicker",
		date: "2026-10-03",
		link: `${GH}/bropicker`,
		ruTitle: "Создала проект bropicker",
		enTitle: "Created the bropicker project",
		ruBody: "Начала новую GUI-утилиту на Slint и Rust.",
		enBody: "Started a new GUI utility built with Slint and Rust.",
		tags: ["rust", "slint"],
	},
	{
		slug: "obnovila-easy-png-tools",
		date: "2026-10-04",
		link: `${GH}/easy-png-tools`,
		ruTitle: "Обновила easy-png-tools",
		enTitle: "Updated easy-png-tools",
		ruBody:
			"Продолжаю пилить набор утилит для картинок — бесплатную замену onlinepngtools.",
		enBody:
			"Keep working on my image utilities set — a free replacement for onlinepngtools.",
		tags: ["typescript", "tools"],
	},
	{
		slug: "zapustila-twitch-announce-bot",
		date: "2026-09-25",
		link: `${GH}/twitch-announce-telegram-bot`,
		ruTitle: "Запустила бота анонсов стрима",
		enTitle: "Launched a stream announce bot",
		ruBody:
			"Бот на TypeScript теперь сам постит анонс в Telegram-канал, когда начинается стрим.",
		enBody:
			"A TypeScript bot now automatically posts an announcement to a Telegram channel when the stream goes live.",
		tags: ["twitch", "telegram", "bot"],
	},
	{
		slug: "sdelala-twitch-doc-panel",
		date: "2026-09-24",
		link: `${GH}/twitch-doc-panel`,
		ruTitle: "Сделала панель документов для Twitch",
		enTitle: "Built a doc panel for Twitch",
		ruBody:
			"Инфо-панель для канала на несколько страниц: обычные markdown-файлы с картинками, правилами и ссылками.",
		enBody:
			"A multi-page info panel for the channel: plain markdown files with images, rules and links.",
		tags: ["twitch", "markdown"],
	},
	{
		slug: "napisala-git-overhooks",
		date: "2026-09-19",
		link: `${GH}/git-overhooks`,
		ruTitle: "Написала менеджер git-хуков",
		enTitle: "Wrote a git hooks manager",
		ruBody: "git-overhooks — менеджер git-хуков на Rust.",
		enBody: "git-overhooks — a git hooks manager written in Rust.",
		tags: ["rust", "git"],
	},
	{
		slug: "sdelala-sla-monitor",
		date: "2026-09-11",
		link: `${GH}/github-support-sla-monitor`,
		ruTitle: "Сделала мониторинг ответов GitHub Support",
		enTitle: "Built a GitHub Support response monitor",
		ruBody:
			"После истории с блокировкой стало интересно, как быстро GitHub вообще отвечает людям. Сделала мониторинг.",
		enBody:
			"After the ban story I got curious how fast GitHub actually responds to people. So I built a monitor.",
		tags: ["github", "monitoring"],
	},
	{
		slug: "sozdala-brul",
		date: "2026-09-10",
		link: `${GH}/brul`,
		ruTitle: "Создала проект brul",
		enTitle: "Created the brul project",
		ruBody: "Новая утилита на Rust.",
		enBody: "A new Rust utility.",
		tags: ["rust"],
	},
	{
		slug: "vylozhila-shooting-word",
		date: "2026-06-26",
		link: `${GH}/shooting-word-html`,
		ruTitle: "Выложила Shooting Word",
		enTitle: "Released Shooting Word",
		ruBody:
			"Игра для Twitch-чата: зрители отстреливают слова, есть волны, боссы и таблица лидеров. Подключается как OBS Browser Source.",
		enBody:
			"A Twitch chat game: viewers shoot words, with waves, bosses and a leaderboard. Plugs in as an OBS Browser Source.",
		tags: ["twitch", "game", "obs"],
	},
];

const ARTICLE_RU = `Две недели назад я была обычным разработчиком. У меня были рабочие сервисы, публичное портфолио, принятый PR в open-source и удобный вход «через GitHub» на двух десятках сайтов.

Сегодня меня не существует.

Экран ноутбука встречает тёмной надписью:

**"Your account has been suspended. TOS violation."**

Ни ссылки на нарушенный пункт. Ни «вы сделали X, а это нарушает Y». Ни срока блокировки. Ни имени, кому написать. Просто сухая формулировка, от которой разит автоматикой. Живого человека на той стороне не было — алгоритм чихнул, и меня не стало.

GitHub просто щёлкнул выключателем. И даже не посмотрел, что погасло.

Я делала всё «по науке»: контрибьютила в open-source (мой PR есть в **cocogitto**), заводила сервисы, верила в платформу. Но для алгоритма GitHub я не инженер. Я просто строка с \`is_active: false\`.

<!--more-->

## Акт 1. Анатомия веерного отключения: 7 проектов и 10+ сервисов за 1 секунду

### 1. GitHub Pages

Вот что лежало на GitHub Pages и умерло в один момент:

- **CSS Matrix3D Perspective Calculator** — утилита для расчёта CSS \`matrix3d()\`-искажения. Дизайнеры и фронтендеры пользовались ей каждый день.
- **Twitch Panels Creator** — генератор панелей для Twitch-канала. Svelte 5, Konva.js, тёмная/светлая тема, экспорт в PNG/ZIP.
- **Shooting Word** — интерактивная игра для Twitch-чата. Волны, боссы, таблица лидеров. OBS Browser Source.
- **Now Playing Widget** — OBS-виджет с текущим треком из AIMP/Foobar2000/MusicBee. Один HTML-файл.
- **XBOCT Page** — стартовая страница для браузера. Svelte 5, TypeScript, Chrome Extension.
- **Idle Tower Defence** — игра на Three.js + miniplex + Svelte (незаконченная).
- Личный сайт в терминальном стиле с ASCII-артом.

И это не считая Gist'ов, POC'ов и концептов, которые нельзя было склонировать локально — они потеряны навсегда.

Все они висели на GitHub Pages. Один аккаунт — и все страницы легли.

### 2. is-a.dev

У меня был домен \`*.is-a.dev\`. Его механика завязана на GitHub: ты коммитишь JSON с DNS-записями в репозиторий, проходит проверка — домен резолвится. Аккаунт заморожен — я не могу сделать коммит.

И тут происходит сюрреализм.

GitHub, который игнорирует меня вторую неделю, присылает письмо: *"We are unable to find a verification TXT record on your domain. Please verify your domain within 7 days"*.

Вы заперли меня снаружи, выбросили ключи, а теперь стучите в окно и угрожаете выселением за то, что я не убираюсь в квартире? Вы две недели не можете ответить на вопрос **«за что заблокировали?»**, но я должна за 7 дней решить вашу проблему с DNS, к которой у меня нет доступа, потому что вы же меня и заблокировали?

Я не могу зайти в аккаунт. Я не могу сделать коммит. Я не могу даже «отметиться», чтобы домен не попал под чистку неактивных записей. is-a.dev периодически чистит старые домены — и я ничем не могу это предотвратить.

И это не просто «ой, домен не откроется». Это уязвимость. Мой домен сейчас указывает на несуществующую страницу — любой может сделать Subdomain Takeover и развернуть там свой контент. А я даже это не могу предотвратить.

### 3. GitHub OAuth — чёртова дыра

Я, как и тысячи разработчиков, привыкла жать "Login with GitHub" везде, где можно. Это же удобно, правда? Один клик — и ты внутри.

А теперь представьте: вы теряете доступ к почтовому ящику. Ко всем соцсетям сразу. Ко всем банковским уведомлениям. Вот что значит потерять GitHub OAuth, когда он — твой единый вход во всё:

- **Netlify** — деплои, домены, настройки.
- **Vercel** — то же самое.
- **Railway** — продовые проекты, базы данных, окружения.
- **CircleCI, Travis CI** — CI/CD, который перестаёт быть вашим.
- **CodeSandbox** — песочницы с кодом.
- **Replit** — проекты.
- **Gitpod** — среды разработки.
- **Zeplo** — API-ключи, вебхуки.
- **npms.io, bundlephobia** — мелочи, но и они требуют входа.
- **pollinations.ai** — генератор изображений, вход только через GitHub.

Десятки сервисов. Годы кода, настроек, конфигураций, интеграций. Одна кнопка "Login with GitHub" — и, когда GitHub дёргает рубильник, все эти двери захлопываются одновременно.

И это не только прошлое — это будущее, которое ты не можешь начать. MVP моей новой игры делается за 4 часа, а я жду разморозки уже вторую неделю. У сервиса, который мне нужен, нет входа по почте — только GitHub. Четыре часа работы упёрлись в бан, к которому я не имею никакого отношения.

## Акт 2. AI-powered support

Слоган GitHub — "The AI-powered developer platform". Теперь я понимаю, что значит AI-powered. Это когда за бан отвечает тупой скрипт, а за поддержку — автоответчик, посылающий тебя на форум, где ты не можешь написать, потому что забанена. Отличная экосистема, 10 из 10.

Я написала в саппорт. Подробно расписала ситуацию. Попросила объяснений.

Через пару минут прилетело автоматическое: *"Thank you for contacting GitHub Support. … We are experiencing high volumes… You can also post a question in the GitHub Community."*

«Спроси в сообществе!» — но я не могу туда зайти. Мой аккаунт заморожен. Буквально: «мы не можем помочь, спроси у других пользователей», но чтобы спросить — нужен аккаунт, которого у меня нет.

Прошло две недели. Живого ответа — ноль.

Забанить — 5 минут. Разобраться — вечность. GitHub тратит секунды на то, чтобы уничтожить годы твоей работы, и недели — чтобы хотя бы ответить на вопрос «за что?».

Там просто нет человека. Поддержка GitHub — это ширма. За ней пустота. А все твои сервисы лежат уже сейчас.

## Акт 3. Если 30 000 звёзд — не аргумент

Я не одна такая. В один день со мной под раздачу попал разработчик zapret-discord-youtube (Flowseal) — репозиторий с 30 000+ звёзд и тысячами форков. Алгоритм чихнул — и 30k звёзд не аргумент.

Если ваша антифрод-система за 5 минут стирает репозиторий с 30 000 звёзд и аккаунт мейнтейнера, которым пользуются сотни тысяч людей, — ваша система не защищает платформу. Она профнепригодна. Вы создали алгоритм, у которого гранатомёт вместо скальпеля.

Крупные проекты с тысячами звёзд иногда удаётся вернуть — за счёт известности автор привлекает внимание, и тикет разгребают быстрее. У обычных разработчиков такого рычага нет.

И это доказывает главное: у GitHub нет понятной системы правосудия. Если за тобой нет армии подписчиков, популярного репозитория или вирусного треда — ты просто цифровая пыль в бесконечной очереди тикетов, которую никто не спешит обслуживать.

По интернету разбросаны десятки таких историй — люди теряют аккаунты после случайного пуша, после автоматического сканирования репозиториев, после ложного срабатывания антифрод-системы. GitHub не разбирается — GitHub банит.

Если твой аккаунт могут положить с тем же успехом, что и мой, — о чём вообще говорить? Если 30k звёзд не аргумент — твои 5 не аргумент тем более.

## Что делать, пока алгоритм не чихнул в твою сторону

Я не надеюсь, что GitHub прочитает эту статью и разморозит меня. Я надеюсь на другое.

### GitHub OAuth — это не твоя система аутентификации. Это аренда.

У тебя нет контракта. Нет SLA. Нет гарантий, что завтра кнопка логина сработает. Есть только алгоритм, который без предупреждения ставит крест на годах твоей работы.

Один флаг в базе данных — и ты персональный изгой.

### Что делать прямо сейчас

1. **Экспортируй данные.** Регулярно. Потому что в один день ты можешь просто не успеть.
2. **Составь список сервисов, куда заходишь через GitHub.** Напротив каждого напиши: «Что я буду делать, если завтра эта кнопка перестанет работать?» Если ответа нет — у тебя проблема.
3. **Бойкотируй сервисы, которые предлагают ТОЛЬКО GitHub OAuth.** Email + пароль или другой провайдер — это база. Если сервис на этом экономит — он экономит на тебе.
4. **Привяжи резервный email и 2FA-ключи прямо сейчас.** Убедись, что на всех ключевых сервисах (Vercel, Netlify, Railway) у тебя включён альтернативный вход по почте или Google OAuth — пока доступ ещё есть.

## Финально

GitHub заморозил мой аккаунт. Без предупреждения. Без объяснения. Без права на защиту.

Мои сервисы мертвы. Мой домен не резолвится. Мой цифровой паспорт больше никуда не открывает двери.

Потому что один флаг в чужой базе данных переключился с 0 на 1.

В следующий раз, когда нажмёшь "Login with GitHub", вспомни: ты не логинишься. Ты просишь разрешения войти в дом, ключи от которого держит кто-то другой. И в любой момент этот кто-то может просто не открыть.

Если меня разморозят, я продолжу пользоваться GitHub. Не потому что я ему доверяю, а потому что это монополия. Но отныне GitHub для меня — не «дом для кода», а ненадёжная инфраструктура. Каждый мой Gist будет дублироваться локально. Каждый issue — иметь бэкап. А кнопка «Login with GitHub» для меня умерла навсегда.

GitHub учит нас архитектуре на собственном примере: **никогда не стройте систему с единой точкой отказа.** Особенно если эта точка отсекает тебя по ошибке и молчит неделями.`;

const ARTICLE_EN = `Two weeks ago, I was a regular developer. I had working services, a public portfolio, an accepted PR in open-source, and convenient "Login with GitHub" on two dozen sites.

Today, I don't exist.

My laptop screen greets me with a dark message:

**"Your account has been suspended. TOS violation."**

No link to the violated clause. No "you did X, which violates Y". No suspension period. No name of a person to write to. Just a dry formulation that reeks of automation. There was no human on the other side — an algorithm sneezed, and I ceased to exist.

GitHub flipped a switch. And didn't even look to see what went dark.

I did everything "by the book": I contributed to open-source (my PR is in **cocogitto**), set up services, trusted the platform. But to GitHub's algorithm, I'm not an engineer. I'm just a row with \`is_active: false\`.

<!--more-->

## Act 1. Anatomy of a Cascading Failure: 7 Projects and 10+ Services in 1 Second

### 1. GitHub Pages

Here's what was hosted on GitHub Pages and died in an instant:

- **CSS Matrix3D Perspective Calculator** — a tool for calculating CSS \`matrix3d()\` distortion. Designers and frontend developers used it daily.
- **Twitch Panels Creator** — a panel generator for Twitch channels. Svelte 5, Konva.js, dark/light theme, PNG/ZIP export.
- **Shooting Word** — an interactive Twitch chat game. Waves, bosses, leaderboard. OBS Browser Source.
- **Now Playing Widget** — a minimal OBS widget showing the current track from AIMP/Foobar2000/MusicBee. One HTML file.
- **XBOCT Page** — a browser start page with bookmark management. Svelte 5, TypeScript, Chrome Extension.
- **Idle Tower Defence** — a game built with Three.js + miniplex + Svelte (unfinished).
- A personal portfolio site with terminal-style ASCII art.

And that's not counting the Gists, POCs, and concepts that couldn't be cloned locally — they're gone forever.

All of them ran on GitHub Pages. One account — and every single page went down.

### 2. is-a.dev

I owned a \`*.is-a.dev\` domain. The mechanics are tied to GitHub: you commit a JSON file with DNS records to the registry repository, it gets reviewed, and the domain resolves. Account frozen — I can't make a commit.

Then the surrealism kicks in.

GitHub, which has been ignoring me for two weeks, sends me an email: *"We are unable to find a verification TXT record on your domain. Please verify your domain within 7 days."*

You locked me out, threw away the keys, and now you're knocking on the window demanding I tidy up the apartment? You can't answer **"why was I banned?"** in two weeks, but I'm supposed to solve your DNS problem in 7 days — a problem I can't access because you banned me?

I can't log in. I can't make a commit. I can't even "check in" to avoid being pruned for inactivity. is-a.dev periodically cleans up old domains — and I have no way to stop it.

And this isn't just "oh, my domain won't resolve." It's a security vulnerability. My domain now points to a non-existent page — anyone could perform a subdomain takeover and serve their own content there. And I can't even prevent that.

### 3. GitHub OAuth — The Black Hole

Like thousands of developers, I got used to clicking **"Login with GitHub"** everywhere I could. It's convenient, right? One click and you're in.

Now imagine losing access to your email inbox. To every social network. To every bank notification. That's what it means to lose GitHub OAuth when it's your single sign-on for everything:

- **Netlify** — deploys, domains, settings. GitHub-only login.
- **Vercel** — same story.
- **Railway** — production projects, databases, environments.
- **CircleCI, Travis CI** — CI/CD that's no longer yours.
- **CodeSandbox** — code sandboxes.
- **Replit** — projects.
- **Gitpod** — dev environments.
- **Zeplo** — API keys, webhooks.
- **ESLint, npms.io, bundlephobia** — minor, but they still require login.
- **pollinations.ai** — image generation, GitHub-only login.

Dozens of services. Years of code, configuration, integrations. One **"Login with GitHub"** button — and when GitHub pulls the plug, every door slams shut at once.

And it's not just the past — it's the future you can't even start. An MVP for my new game would take 4 hours to build, but I've been waiting for unban for two weeks. The service I need has no email login — only GitHub. Four hours of work blocked by a ban I had nothing to do with.

## Act 2. AI-Powered Support

GitHub's tagline is *"The AI-powered developer platform"*.

Now I understand what AI-powered means. It means a dumb script handles the ban, and an autoresponder handles support — sending you to a forum where you can't post because you're banned. Great ecosystem, 10 out of 10.

I contacted support. Explained the situation in detail. Asked for an explanation.

A few minutes later, the automated reply arrived:

> *"Thank you for contacting GitHub Support. … We are experiencing high volumes… You can also post a question in the GitHub Community."*

"Ask the community!" — but I can't log in. My account is suspended. Literally: "we can't help, ask other users" — but to ask, you need an account you no longer have.

Two weeks. Zero human responses.

Banning takes 5 minutes. Figuring things out takes an eternity. GitHub spends seconds destroying years of your work and weeks to even answer the question **"why?"**.

There's simply no human there. GitHub Support is a facade. An empty void behind it. And all your services are already down.

## Act 3. If 30,000 Stars Aren't Enough

I'm not alone.

The same day, the developer of **zapret** (Flowseal) got caught in the same sweep — a repository with 30,000+ stars and thousands of forks. The algorithm sneezed, and 30k stars weren't enough to stop it.

If your anti-fraud system can wipe a 30,000-star repository and its maintainer's account in 5 minutes — a tool used by hundreds of thousands of people — then your system doesn't protect the platform. It's incompetent. You built an algorithm with a rocket launcher instead of a scalpel.

Big projects with thousands of stars sometimes get reinstated — because the author's visibility draws attention, and the ticket gets handled faster. Regular developers don't have that leverage.

And that proves the point: GitHub has no transparent justice system. If you don't have an army of followers, a popular repository, or a viral thread — you're just digital dust in an endless ticket queue that nobody's in a hurry to service.

There are dozens of similar stories scattered across the internet — people losing accounts after a routine push, after an automated repo scan, after a false positive from the fraud detection system. GitHub doesn't investigate — GitHub bans.

If your account can be taken down just as easily as mine — what's there to say? If 30k stars aren't enough to save you, your 5 stars certainly won't be.

## What to Do Before the Algorithm Sneezes in Your Direction

I don't expect GitHub to read this article and unban me. I hope for something else.

### GitHub OAuth Isn't Your Auth System. It's a Rental.

You have no contract. No SLA. No guarantee that the login button will work tomorrow. There's only an algorithm that, without warning, wipes out years of your work in an instant.

One flag in a database — and you're a digital outcast.

### What to Do Right Now

1. **Export your data.** Regularly. Because one day, you might not have time.
2. **Make a list of every service you log into with GitHub.** Next to each one, write: "What will I do if this button stops working tomorrow?" If you don't have an answer — you have a problem.
3. **Boycott services that offer ONLY GitHub OAuth.** Email + password or another provider is the bare minimum. If a service skimps on that — they're skimping on you.
4. **Set up an alternative login method and save recovery codes right now.** Make sure every critical service (Vercel, Netlify, Railway) has an alternative login method — email/password or Google OAuth — while you still have access.

## Final Words

GitHub suspended my account. Without warning. Without explanation. Without the right to defend myself.

My services are dead. My domain doesn't resolve. My digital passport no longer opens any doors.

All because one flag in someone else's database flipped from 0 to 1.

Next time you click **"Login with GitHub"**, remember: you're not logging in. You're asking for permission to enter a house whose keys belong to someone else. And at any moment, that someone might simply not open the door.

If I get unbanned, I'll keep using GitHub. Not because I trust it, but because it's a monopoly. But from now on, GitHub isn't a "home for code" to me — it's unreliable infrastructure. Every Gist will be duplicated locally. Every issue will have a backup. And the "Login with GitHub" button is dead to me forever.

GitHub teaches us architecture by example: **never build a system with a single point of failure.** Especially when that point can cut you off by mistake and stay silent for weeks.`;

const NO_DESCRIPTION = new Set([
	"twitch-panels",
	"css-matrix-calc",
	"shooting-word",
	"now-playing",
	"xboct-page",
	"bropicker",
	"brul",
	"tg-bot",
	"tray-run",
	"updater",
	"idle-chat-game",
	"twitch-cafe",
	"twitch-edge-tts",
	"xboct-chat",
	"rubber-duck",
	"multi-widget",
	"rock-roll-puzzle",
	"pizdudes",
	"eye-candy",
	"bun-dce-poc",
	"vite-poc",
	"weekly-report",
	"x-fantasy-console",
	"lopata",
	"v-domike",
	"sveltekit-template",
	"itd",
	"twitch-announce-telegram-bot",
	"git-overhooks",
	"effect-ts-practice",
	"ku6epxboctuk-github-io",
]);

async function main(): Promise<void> {
	for (const project of PROJECTS) {
		const shared: Record<string, unknown> = {
			repo: `${GH}/${project.repo}`,
			tags: project.tags,
			status: project.status ?? "ready",
		};
		if (project.order !== undefined) shared.order = project.order;
		if (project.icon) shared.icon = project.icon;
		if (project.color) shared.color = project.color;

		await saveEntry(
			"project",
			project.slug,
			unit(
				"project",
				project.slug,
				shared,
				{
					frontmatter: NO_DESCRIPTION.has(project.slug)
						? { title: project.repo }
						: { title: project.repo, description: project.ru },
					body: "",
				},
				{
					frontmatter: NO_DESCRIPTION.has(project.slug)
						? { title: project.repo }
						: { title: project.repo, description: project.en },
					body: "",
				},
			),
		);
		console.log(`project: ${project.slug}`);
	}

	for (const post of POSTS) {
		const shared: Record<string, unknown> = {
			date: post.date,
			tags: post.tags,
		};
		if (post.link) shared.link = post.link;

		await saveEntry(
			"post",
			post.slug,
			unit(
				"post",
				post.slug,
				shared,
				{ frontmatter: { title: post.ruTitle }, body: post.ruBody },
				{ frontmatter: { title: post.enTitle }, body: post.enBody },
			),
		);
		console.log(`post: ${post.slug}`);
	}

	await saveEntry(
		"article",
		"anatomiya-blokirovki-github",
		unit(
			"article",
			"anatomiya-blokirovki-github",
			{ date: "2026-07-24", tags: ["github", "webdev", "devops"] },
			{
				frontmatter: {
					title:
						"Анатомия блокировки: почему «Login with GitHub» — главная архитектурная ошибка в вашей жизни",
				},
				body: ARTICLE_RU,
			},
			{
				frontmatter: {
					title:
						'Anatomy of a Ban: Why "Login with GitHub" Is the Biggest Architectural Mistake of Your Life',
				},
				body: ARTICLE_EN,
			},
		),
	);
	console.log("article: anatomiya-blokirovki-github");
}

await main();
