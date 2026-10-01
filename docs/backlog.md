# Backlog

- [ ] `prettier` вшивается в серверный бандл редактора: сборка ругается на
      circular dependency из `semver`. Пометить `ssr.external: ["prettier"]`
- [ ] `createFlatLoader` в `src/lib/loaders.ts` не используется — удалить
- [ ] вынести общее в `src/lib/{posts,articles,projects,weekly}.ts`: глобы,
      draft-фильтр и маппинг frontmatter повторяются четыре раза
- [ ] тизер статьи (`<!--more-->`) не рендерится ни в одной карточке — либо
      показывать, либо убрать требование линтера
- [ ] нет страницы тегов и фильтра по тегам
- [ ] `src/content-mocks/**` попадает в production-глобы `import.meta.glob`,
      если моки сгенерированы — исключать на этапе сборки
- [ ] `checkFieldType` в `content-core/src/validate.ts` не проверяет числа:
      `order: "abc"` пройдёт и уронит сортировку проектов
- [ ] `frontmatter.json` и `config/weekly` — правила валидации weekly живут
      только в линтере, в `fields.ts` его нет: при добавлении нового типа легко
      забыть про `validate.ts`

Из проекта редактора (`docs/plan-editor.md`), но не в его объём:

- [ ] превью в iframe: `pnpm dev` сайта на 5173 + редактор на 4321, iframe с
      live reload, обновление по Save
- [ ] генерация weekly: план в [docs/plan-weekly.md](plan-weekly.md)
- [ ] размер баннеров подтвердить на реальных картинках из `static/images/` —
      сейчас стоит 1200×630, но не факт, что он подходит
