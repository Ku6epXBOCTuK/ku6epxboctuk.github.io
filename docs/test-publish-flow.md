# Тестирование процесса публикации

## Подготовка

Убедись, что `posts.yaml` существует (создай, если нет):

```powershell
echo "" > posts.yaml
```

Для создания тестовых единиц используем визард (`npm run new`) или готовые
файлы. Ниже — проверки `prepare-post.ts` локально, без реальной отправки;
последние тесты — с отправкой.

---

## Тест 1: Новый пост

### Шаг 1. Создай единицу

```powershell
npm run new post test-post
```

Появится папка `src/content/posts/test-post/` с `index.ru.md` и `index.en.md`.

### Шаг 2. Подготовка (только ru-файл)

```powershell
$env:FILES='src/content/posts/test-post/index.ru.md'; npx tsx scripts/prepare-post.ts
```

### Шаг 3. Проверь `.post-meta.json`

```powershell
Get-Content .post-meta.json
```

В `socialText`:

```txt
Выложен новый пост: Test Post

Текст поста.

🔗 читать полностью: https://ku6epxboctuk.github.io/posts/test-post
```

### Шаг 4. Отправка

```powershell
npm run publish
```

Ожидаемый результат:

```txt
New "test-post". Publishing...
Telegram: sent, message_id=...
Discord: sent, id=...
Done.
```

### Шаг 5. Проверь `posts.yaml`

```yaml
posts:
  test-post:
    telegram: <число>
    discord: <строка>
```

---

## Тест 2: Редактирование поста

### Шаг 1. Измени текст

Отредактируй `src/content/posts/test-post/index.ru.md` — поменяй текст в теле.

### Шаг 2. Подготовка и публикация

```powershell
$env:FILES='src/content/posts/test-post/index.ru.md'; npx tsx scripts/prepare-post.ts
npm run publish
```

Ожидаемый результат:

```txt
[posts] "test-post" already published. Editing...
Telegram: edited message <id>
Discord: edited message <id>
Done.
```

Если Telegram пишет "already up to date" — контент не изменился, это нормально.

---

## Тест 3: Перевод не публикуется

### Шаг 1. Подготовь только en-файл

```powershell
$env:FILES='src/content/posts/test-post/index.en.md'; npx tsx scripts/prepare-post.ts
```

Ожидаемый результат — контент не изменился, ничего не публикуется:

```txt
No content files changed, nothing to do.
```

### Шаг 2. Два файла пары в одном пуше

```powershell
$env:FILES='src/content/posts/test-post/index.ru.md src/content/posts/test-post/index.en.md'; npx tsx scripts/prepare-post.ts
```

В `.post-meta.json` должен быть только 1 элемент (ru).

---

## Тест 4: Черновик пропускается

### Шаг 1. Поставь `draft: true` в `index.ru.md`

### Шаг 2. Подготовка черновика поста

```powershell
$env:FILES='src/content/posts/test-post/index.ru.md'; npx tsx scripts/prepare-post.ts
```

Ожидаемый результат:

```txt
Skipping draft [posts]: test-post
Prepared 0 item(s).
```

### Шаг 3. Верни `draft` или удали поле

---

## Тест 5: Статья с `<!--more-->`

### Шаг 1. Создай статью

```powershell
npm run new article test-article
```

### Шаг 2. Подготовка статьи

```powershell
$env:FILES='src/content/articles/test-article/index.ru.md'; npx tsx scripts/prepare-post.ts
```

В `socialText` попадает только текст **до** `<!--more-->` (тизер).

---

## Тест 6: Проект (description и url)

### Шаг 1. Создай минимальный файл

```powershell
New-Item -ItemType Directory -Force src\content\projects\test-project
Set-Content src\content\projects\test-project\index.ru.md @'
---
title: Test Project
description: test project description
repo: https://github.com/Ku6epXBOCTuK/test-project
demo: https://ku6epxboctuk.github.io/test-project
---
'@
```

### Шаг 2. Подготовка

```powershell
$env:FILES='src/content/projects/test-project/index.ru.md'; npx tsx scripts/prepare-post.ts
```

В `socialText` — описание и ссылка на `demo` (при его наличии):

```txt
Добавлен проект: Test Project

test project description

🔗 https://ku6epxboctuk.github.io/test-project
```

---

## Тест 6b: Проект без `demo`

Убери `demo` из frontmatter — в `socialText` уйдёт `repo`:

```txt
🔗 https://github.com/Ku6epXBOCTuK/test-project
```

---

## Тест 7: Несколько файлов одновременно

```powershell
$env:FILES='src/content/posts/test-post/index.ru.md src/content/articles/test-article/index.ru.md'; npx tsx scripts/prepare-post.ts
Get-Content .post-meta.json
```

В `.post-meta.json` — 2 элемента; при публикации — отправка с задержкой 1с.

---

## Очистка

```powershell
Remove-Item -Recurse -Force src\content\posts\test-post, src\content\articles\test-article, src\content\projects\test-project
Remove-Item -Force .post-meta.json
```

---

## Диагностика проблем

### Telegram не отправляется

```powershell
echo $env:TELEGRAM_BOT_TOKEN
echo $env:TELEGRAM_CHAT_ID
```

Токены для локального запуска берутся из `.env.publish` (скрипт
`npm run publish`).

### Discord не отправляется

```powershell
echo $env:DISCORD_WEBHOOK_URL
```

### "message is not modified"

Нормально — контент не изменился, Telegram считает это успехом.

### Discord 404 "Unknown Message"

Старое сообщение удалено. Удали запись из `posts.yaml` и перезапусти скрипт —
отправится новое сообщение.
