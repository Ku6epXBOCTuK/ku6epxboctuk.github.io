export type Post = {
  slug: string
  date: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  image?: string
  likes: number
}

export type Article = {
  slug: string
  date: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  readingTime: number
  image?: string
}

export type Project = {
  slug: string
  title: string
  description: string
  content: string
  tags: string[]
  color: 'pink' | 'mint' | 'blue'
  icon: string
  image?: string
  links: { label: string; url: string }[]
  status: 'active' | 'maintenance' | 'archived'
}

export type Report = {
  slug: string
  dateStart: string
  dateEnd: string
  items: { project: string; changes: string }[]
}

export const posts: Post[] = [
  {
    slug: 'css-animation-bug',
    date: '9 июня 2024, 09:42',
    title: 'Наконец-то победила z-index баг',
    excerpt: 'Спасает один простой трюк',
    content: `Два часа отладки... потом осознание: всё дело было в стековом контексте. Когда элемент имеет transform или opacity, он создаёт новый стековый контекст, и z-index не работает так, как ожидается.

Решение: либо убрать лишний transform, либо переделать иерархию DOM. Я выбрала второе — это решило проблему с анимацией и улучшило производительность.

Мораль: иногда простой рефакторинг HTML спасает больше, чем CSS хаки.`,
    tags: ['#разработка', '#css', '#будни'],
    image: '/images/blog/cat-signal.png',
    likes: 12,
  },
  {
    slug: 'dark-mode-added',
    date: '8 июня 2024, 18:20',
    title: 'Добавила тёмную тему в проект',
    excerpt: 'Теперь можно работать ночью',
    content: `Ночное кодирование требует бережного отношения к глазам. Обновила весь блог на CSS custom properties и добавила ручное переключение светлой/тёмной темы.

Использовала prefers-color-scheme для автоматического определения, но также оставила ручное переключение кнопкой — потому что иногда хочется работать в тёмной теме днём.

Главный трюк: хранить выбор пользователя в localStorage и применять класс .dark к корневому элементу.`,
    tags: ['#дизайн', '#код', '#доступность'],
    likes: 8,
  },
  {
    slug: 'kawaii-tech-aesthetic',
    date: '7 июня 2024, 14:05',
    title: 'Сколько милых интерфейсов можно придумать?',
    excerpt: 'Если добавить неон к kawaii...',
    content: `Обнаружила, что пастельные цвета + скруглённые углы + немного неона = идеальный микс. Kawaii tech — это не просто милота, это милота с намёком на технологию.

Начала собирать вдохновение: мягкие закругления (border-radius 18px и выше), пастельная палитра (розовый #ffb6d5, мятный #bcefe3, голубой #c8d9ff), и киберпанк детали (тонкие линии, сетка фона, маленькие иконки).

Результат: интерфейсы, которые приносят радость и одновременно функциональны.`,
    tags: ['#kawaiitech', '#дизайн', '#вдохновение'],
    likes: 21,
  },
]

export const articles: Article[] = [
  {
    slug: 'why-i-love-next-js',
    date: '1 июня 2024',
    title: 'Почему я полюбила Next.js',
    excerpt: 'Год работы, 5 проектов, много разочарований и побед',
    content: `Next.js — это не просто фреймворк, это философия разработки. За год работы с ним я поняла, почему столько людей его рекомендуют.

## Серверные компоненты изменили всё

React Server Components — это был aha! момент. Вместо отправки всего JS в браузер, мы можем обрабатывать часть логики на сервере. Это значит быстрее, меньше JS, безопаснее.

## Файловая маршрутизация — просто красота

Забудьте о конфиге маршрутов. Если создаёте файл \`app/posts/page.tsx\`, он автоматически становится маршрутом \`/posts\`. Интуитивно и масштабируемо.

## API Routes — backend за секунды

Создаёте \`app/api/hello/route.ts\` — и вот уже у вас есть API endpoint без отдельного сервера. Perfect для прототипирования и небольших проектов.

Но не всё идеально. Документация иногда плывёт, breaking changes бывают резкие, и динамическая маршрутизация может быть запутанной.

Всё равно рекомендую. Это фреймворк, который заставляет думать о производительности и масштабируемости с самого начала.`,
    tags: ['#nextjs', '#разработка', '#опыт'],
    readingTime: 8,
    image: '/images/blog/focus-garden.png',
  },
]

export const projects: Project[] = [
  {
    slug: 'mochi-ui',
    title: 'Mochi UI',
    description: 'Милый UI-кит для тех, кто любит делать красиво.',
    content: `Mochi UI — это компонентная библиотека, собранная вокруг kawaii aesthetic. Содержит готовые к использованию кнопки, карточки, модальные окна и другие компоненты.

**Особенности:**
- Полностью на TypeScript
- Tailwind CSS для стилей
- Доступность встроена с самого начала
- Dark mode из коробки
- Responsive дизайн

**Цель:** помочь разработчикам создавать красивые интерфейсы без боли с кастомизацией цветов и размеров.`,
    tags: ['React', 'TypeScript', 'CSS', 'UI Kit'],
    color: 'pink',
    icon: '◈',
    image: '/images/blog/mochi-ui.png',
    links: [
      { label: 'GitHub', url: '#' },
      { label: 'Docs', url: '#' },
      { label: 'Storybook', url: '#' },
    ],
    status: 'active',
  },
  {
    slug: 'focus-garden',
    title: 'Focus Garden',
    description: 'Минималистичный Pomodoro-таймер с растениями.',
    content: `Focus Garden — это Pomodoro таймер, где каждый помидор (завершённый интервал концентрации) выращивает цветок в вашем цифровом саду.

**Механика:**
- 25 минут концентрации = одно растение растёт на один уровень
- Перерыв = возможность поухаживать за садом
- За неделю терпеливой работы получаете целый сад

**Стек:**
- Next.js для фронта
- Supabase для хранения сада каждого пользователя
- Простая аналитика (статистика за день/неделю)

Идея в том, что видимый прогресс в виде растущего сада намного мотивирует больше, чем просто число "помидоров в день".`,
    tags: ['Next.js', 'Supabase', 'Productivity', 'Web3'],
    color: 'mint',
    icon: '✦',
    image: '/images/blog/focus-garden.png',
    links: [
      { label: 'GitHub', url: '#' },
      { label: 'Live App', url: '#' },
    ],
    status: 'active',
  },
  {
    slug: 'pixel-notes',
    title: 'Pixel Notes',
    description: 'Заметки с пиксельным настроением и синхронизацией.',
    content: `Pixel Notes — это приложение для заметок с уникальным пиксельным эстетикой. Все заметки синхронизируются между устройствами и доступны офлайн.

**Функции:**
- Создание быстрых заметок с тегами
- Поиск по контенту и тегам
- Синхронизация через IndexedDB
- Экспорт в Markdown
- Тёмный режим по умолчанию

**Почему Vue?** Хотела попробовать реактивность Vue 3 с Composition API — и теперь понимаю, почему люди её любят. Composition API намного интуитивнее, чем JSX для некоторых сценариев.`,
    tags: ['Vue', 'IndexedDB', 'Notes', 'Offline-first'],
    color: 'blue',
    icon: '▦',
    image: '/images/blog/focus-garden.png',
    links: [
      { label: 'GitHub', url: '#' },
      { label: 'Live App', url: '#' },
    ],
    status: 'maintenance',
  },
]

export const reports: Report[] = [
  {
    slug: 'week-2024-06-16',
    dateStart: '10 июня',
    dateEnd: '16 июня',
    items: [
      { project: 'Mochi UI', changes: 'Добавлены новые компоненты (Spinner, Tooltip) и обновлена документация' },
      { project: 'Focus Garden', changes: 'Пофиксена ошибка с таймером и добавлены звуки завершения' },
      { project: 'Личное', changes: 'Начала учить Rust и прочитала 2 книги' },
    ],
  },
  {
    slug: 'week-2024-06-09',
    dateStart: '3 июня',
    dateEnd: '9 июня',
    items: [
      { project: 'Mochi UI', changes: 'Первый публичный релиз v0.1.0' },
      { project: 'Pixel Notes', changes: 'Миграция на Vue 3, переписана синхронизация' },
      { project: 'Блог', changes: 'Запущена новая версия с kawaii tech дизайном' },
    ],
  },
]
