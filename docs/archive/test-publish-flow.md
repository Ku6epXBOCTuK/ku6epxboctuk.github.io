# Тестирование процесса публикации

## Подготовка

Убедись что `posts.yaml` существует (создай если нет):

```powershell
echo "" > posts.yaml
```

---

## Тест 1: Новый проект

### Шаг 1. Подготовка

```powershell
$env:FILES='src/projects/itd.md'; npx tsx scripts/prepare-post.ts
```

### Шаг 2. Проверь что создалось

```powershell
cat .post-meta.json
```

В `socialText` должно быть:

```txt
Добавлен проект: itd

idle tower defence game built with three.js and miniplex ecs.

🔗 https://github.com/Ku6epXBOCTuK/itd
```

### Шаг 3. Отправка

```powershell
npx tsx scripts/publish.ts
```

Ожидаемый результат:

```txt
New post "itd". Publishing...
Telegram: sent, message_id=...
Discord: sent, id=...
Done.
```

### Шаг 4. Проверь `posts.yaml`

```powershell
cat posts.yaml
```

Должно содержать:

```yaml
projects:
  itd:
    telegram: <число>
    discord: <строка>
```

### Шаг 5. Проверь Telegram и Discord

Сообщения должны появиться в обоих чатах.

---

## Тест 2: Редактирование проекта

### Шаг 1. Измени проект

Отредактируй `src/projects/itd.md` — поменяй `description` на что-то другое.

### Шаг 2. Подготовка

```powershell
$env:FILES='src/projects/itd.md'; npx tsx scripts/prepare-post.ts
```

### Шаг 3. Проверь socialText

```powershell
cat .post-meta.json
```

Убедись что `socialText` содержит обновлённый description.

### Шаг 4. Редактирование

```powershell
npx tsx scripts/publish.ts
```

Ожидаемый результат:

```txt
Post "itd" already published. Editing...
Telegram: edited message <id>
Discord: edited message <id>
Done.
```

Если Telegram пишет "already up to date" — значит контент не изменился, это
нормально.

### Шаг 5. Проверь что сообщения обновились

---

## Тест 3: Новый пост

### Шаг 1. Создай тестовый пост

Создай файл `src/posts/test-post.md`:

```markdown
---
title: Тестовый пост
date: 2026.06.30
excerpt: Это тестовый пост для проверки публикации
tag: test
---

Это вступление до тега more.

<!--more-->

Основная часть поста, которая не уйдёт в соцсети.
```

### Шаг 2. Подготовка

```powershell
$env:FILES='src/posts/test-post.md'; npx tsx scripts/prepare-post.ts
```

### Шаг 3. Проверь socialText

```powershell
cat .post-meta.json
```

В `socialText` должно быть:

```
Выложен новый пост: Тестовый пост

Это тестовый пост для проверки публикации

Это вступление до тега more.

🔗 читать полностью: https://ku6epxboctuk.github.io/writings/test-post
```

В `socialText` должно быть:

```txt
Выложен новый пост: Тестовый пост

Это тестовый пост для проверки публикации

Это вступление до тега more.

🔗 читать полностью: https://ku6epxboctuk.github.io/writings/test-post
```

### Шаг 4. Отправка

```powershell
npx tsx scripts/publish.ts
```

### Шаг 5. Проверь `posts.yaml`

Должен появиться `test-post` с ID.

### Шаг 6. Редактирование поста

Поменяй `excerpt` в `src/posts/test-post.md`, затем:

```powershell
$env:FILES='src/posts/test-post.md'; npx tsx scripts/prepare-post.ts
npx tsx scripts/publish.ts
```

---

## Тест 4: Несколько файлов одновременно

### Шаг 1. Подготовка

```powershell
$env:FILES='src/posts/test-post.md src/projects/itd.md'; npx tsx scripts/prepare-post.ts
```

### Шаг 2. Проверь что оба файла обработаны

```powershell
cat .post-meta.json
```

Должно быть 2 элемента в массиве.

### Шаг 3. Отправка

```powershell
npx tsx scripts/publish.ts
```

Ожидаемый результат: оба сообщения отправлены с задержкой 1с между ними.

---

## Тест 5: Файл без <!--more-->

### Шаг 1. Создай пост без тега

Создай `src/posts/no-more-test.md`:

```markdown
---
title: Пост без more
date: 2026.06.30
excerpt: Краткое описание
tag: test
---

Полный текст поста без тега more.
```

### Шаг 2. Подготовка

```powershell
$env:FILES='src/posts/no-more-test.md'; npx tsx scripts/prepare-post.ts
```

В логах должно быть предупреждение:

```
Warning: no <!--more--> tag found in src/posts/no-more-test.md. Using excerpt from frontmatter.
```

### Шаг 3. Проверь socialText

```powershell
cat .post-meta.json
```

Должен использоваться `excerpt` из фронтматтера.

### Шаг 4. Очистка

Удали тестовые файлы после проверки:

```powershell
del src\posts\test-post.md
del src\posts\no-more-test.md
del .post-meta.json
```

---

## Диагностика проблем

### Telegram не отправляется

Проверь переменные окружения:

```powershell
echo $env:TELEGRAM_BOT_TOKEN
echo $env:TELEGRAM_CHAT_ID
```

### Discord не отправляется

Проверь URL вебхука:

```powershell
echo $env:DISCORD_WEBHOOK_URL
```

### "message is not modified"

Это нормально — значит контент не изменился. Telegram считает это успехом.

### Discord 404 "Unknown Message"

Старое сообщение было удалено. Нужно:

1. Удалить запись из `posts.yaml`
2. Запустить скрипт заново для отправки нового сообщения
