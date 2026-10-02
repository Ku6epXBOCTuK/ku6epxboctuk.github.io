<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		fieldScope,
		fieldsByScope,
		isValidSlug,
		slugFromTitle,
		type ContentLang,
		type ContentType,
		type Entry,
		type FieldDef,
	} from "@ku6epxboctuk/content-core/shared";
	import type { EntryDetail, ValidationReport } from "$lib/types";
	import { fieldRows } from "$lib/groups";
	import type { GitHubProjectPayload } from "../../routes/api/github-project/+server";
	import Field from "./Field.svelte";
	import MarkdownField from "./MarkdownField.svelte";
	import ValidationPanel from "./ValidationPanel.svelte";
	import ConfirmModal from "./ConfirmModal.svelte";

	interface Props {
		type: ContentType;
		slug: string;
		detail: EntryDetail;
	}

	let { type, slug, detail }: Props = $props();

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };

	let entry = $state<Entry | null>(null);
	let report = $state<ValidationReport | null>(null);
	let status = $state("");
	let ghStatus = $state("");
	let busy = $state(false);

	let renameFrom = $state("");
	let renameTo = $state("");
	let confirmingDelete = $state(false);
	/** Какой язык собираем очистить: null — модалка закрыта. */
	let clearing = $state<ContentLang | null>(null);

	// SvelteKit переиспользует компонент при смене slug, поэтому засеваем
	// состояние из данных только когда сменилась единица, а не на каждый рендер.
	let seeded = "";

	$effect(() => {
		if (seeded === slug) return;
		seeded = slug;
		// Глубокая копия: `detail` принадлежит загрузке страницы, и правка формы
		// не должна расходиться с ней до сохранения.
		const source = detail.entry;
		entry = {
			...source,
			shared: { ...source.shared },
			local: { ...source.local },
			versions: {
				ru: {
					...source.versions.ru,
					frontmatter: { ...source.versions.ru.frontmatter },
				},
				en: {
					...source.versions.en,
					frontmatter: { ...source.versions.en.frontmatter },
				},
			},
		};
		report = detail.validation;
		renameFrom = slug;
		renameTo = slug;
		confirmingDelete = false;
		status = "";
		ghStatus = "";
	});

	/**
	 * Поля одного языка — это ровно `translatable`. Различать ru и en больше
	 * нечем: `only` ушёл вместе с новой раскладкой.
	 */
	function fieldsFor(): FieldDef[] {
		return fieldsByScope(type, "translatable");
	}

	const rows = $derived(fieldRows(type, fieldsFor(), fieldsFor()));

	const metaFileName = $derived(`${type}s.json`);
	const localFileName = $derived(`${type}s.local.json`);

	/**
	 * Корзина, в которой поле лежит: `scope` решает, а не язык. Возвращается
	 * карта, потому что форма обходит поля по именам из схемы, а не по
	 * литеральным ключам, — типизация `Entry` остаётся на границе.
	 */
	function bucketOf(name: string, lang: ContentLang): Record<string, unknown> {
		const current = entry;
		if (!current) return {};

		switch (fieldScope(type, name)) {
			case "shared":
				return current.shared as Record<string, unknown>;
			case "local":
				return current.local as Record<string, unknown>;
			default:
				return current.versions[lang].frontmatter as Record<string, unknown>;
		}
	}

	function valueOf(name: string, lang: ContentLang): unknown {
		return bucketOf(name, lang)[name];
	}

	function setValue(name: string, lang: ContentLang, value: unknown) {
		const bucket = bucketOf(name, lang);
		const empty =
			value === undefined ||
			value === "" ||
			(Array.isArray(value) && value.length === 0);

		if (empty) delete bucket[name];
		else bucket[name] = value;
	}

	const slugOk = $derived(isValidSlug(renameTo));
	const renameChanged = $derived(renameTo !== renameFrom && slugOk);

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	function setBody(lang: ContentLang, body: string) {
		if (entry) entry.versions[lang].body = body;
	}

	/**
	 * Копия одного поля из одного языка в другой. Не тихо: пустое значение в
	 * источнике стирает поле в цели, а копия поверх непустой цели — это
	 * осознанное действие, поэтому кнопка на каждое поле своя и подписана.
	 */
	function copyField(name: string, from: ContentLang, to: ContentLang) {
		const source = bucketOf(name, from);
		const target = bucketOf(name, to);
		const value = source[name];

		if (value === undefined) delete target[name];
		else target[name] = value;

		status = `${fieldLabel(name)}: ${LANG_LABEL[from]} → ${LANG_LABEL[to]}`;
	}

	function fieldLabel(name: string): string {
		return (
			fieldsByScope(type, "translatable")
				.concat(fieldsByScope(type, "shared"), fieldsByScope(type, "local"))
				.find((field) => field.name === name)?.label ?? name
		);
	}

	/**
	 * Копия текста. Молча затирать перевод нельзя, поэтому кнопка активна, пока
	 * в цели пусто.
	 */
	function canCopyText(to: ContentLang): boolean {
		return !entry || entry.versions[to].body.trim() === "";
	}

	function copyText(from: ContentLang, to: ContentLang) {
		if (!entry || !canCopyText(to)) return;
		entry.versions[to].body = entry.versions[from].body;
		clearing = null;
		status = `${LANG_LABEL[from]} → ${LANG_LABEL[to]}`;
	}

	function requestClear(lang: ContentLang) {
		clearing = lang;
	}

	function doClear() {
		const lang = clearing;
		if (!lang || !entry) return;
		entry.versions[lang].body = "";
		clearing = null;
		status = `${LANG_LABEL[lang]} очищен.`;
	}

	/**
	 * Одно сохранение на единицу: `Entry` уезжает целиком, а раскладывать его по
	 * трём файлам — дело репозитория.
	 */
	async function saveBoth() {
		if (!entry) return;
		busy = true;
		status = "";
		try {
			const res = await fetch(`/api/entries/${type}/${slug}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					shared: entry.shared,
					local: entry.local,
					versions: entry.versions,
				}),
			});
			const json = await readJson(res);
			if (!res.ok) {
				status = json.error ?? `HTTP ${res.status}`;
				return;
			}
			report = json.validation;
			status = "Сохранено.";
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function doRename() {
		if (!renameChanged) return;
		busy = true;
		try {
			const res = await fetch(`/api/entries/${type}/${renameFrom}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug: renameTo }),
			});
			const json = await readJson(res);
			if (!res.ok) {
				status = json.error ?? `HTTP ${res.status}`;
				return;
			}
			await goto(`/${type}/${renameTo}`, { invalidateAll: true });
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function doDelete() {
		busy = true;
		try {
			const res = await fetch(`/api/entries/${type}/${slug}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				status = (await readJson(res)).error ?? `HTTP ${res.status}`;
				return;
			}
			await goto("/", { invalidateAll: true });
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	function suggestSlug() {
		const guess = slugFromTitle(
			String(entry?.versions.ru.frontmatter.title ?? ""),
		);
		if (guess) renameTo = guess;
	}

	/**
	 * Дозаполнение из GitHub. Заполняем только пустые поля: ручное не трогаем,
	 * а что не тронули — говорим, чтобы не было сюрпризов.
	 */
	async function pullFromGithub(lang: ContentLang) {
		const url = String(entry?.shared.repo ?? "").trim();
		if (!entry || !url) {
			ghStatus = `${LANG_LABEL[lang]}: впиши ссылку на репозиторий.`;
			return;
		}

		busy = true;
		ghStatus = "Тяну с GitHub…";
		try {
			const res = await fetch("/api/github-project", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url, image: !entry.shared.image }),
			});
			const json = (await readJson(res)) as GitHubProjectPayload & {
				error?: string;
			};
			if (!res.ok) {
				ghStatus = json.error ?? `HTTP ${res.status}`;
				return;
			}

			const filled: string[] = [];
			const skipped: string[] = [];

			for (const [key, incoming] of Object.entries(json.frontmatter)) {
				if (incoming === undefined || incoming === null || incoming === "")
					continue;

				const existing = valueOf(key, lang);
				const empty =
					existing === undefined ||
					existing === null ||
					existing === "" ||
					(Array.isArray(existing) && existing.length === 0);

				if (empty) {
					setValue(key, lang, incoming);
					filled.push(key);
				} else {
					skipped.push(key);
				}
			}

			if (filled.length === 0) {
				ghStatus = "Заполнять нечего: все поля уже есть.";
				return;
			}

			if (!entry.versions[lang].body.trim()) {
				entry.versions[lang].body = json.body ?? "";
			}

			const parts = [`заполнено: ${filled.join(", ")}`];
			if (skipped.length > 0) parts.push(`не тронуто: ${skipped.join(", ")}`);
			parts.push(
				`обложка: ${json.imageFrom === "readme" ? "из README" : "заглушка"}`,
			);
			for (const note of json.notes) parts.push(note);
			ghStatus = parts.join(" · ");
		} catch (err) {
			ghStatus = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="unit">
	<header>
		<a class="back" href="/">← всё</a>
		<h1><span class="kind">{type}</span>{slug}</h1>
		<div class="head-actions">
			<button
				type="button"
				class="danger"
				disabled={busy}
				onclick={() => (confirmingDelete = !confirmingDelete)}
			>
				удалить
			</button>
		</div>
	</header>

	{#if confirmingDelete}
		<div class="confirm">
			<span>Удалить <code>{type}/{slug}</code> вместе с обоими файлами?</span>
			<button type="button" disabled={busy} onclick={doDelete}
				>да, удалить</button
			>
			<button type="button" onclick={() => (confirmingDelete = false)}
				>отмена</button
			>
		</div>
	{/if}

	<section class="shared">
		<div class="shared-head">
			<h2>Общее</h2>
			<span class="file-name">{metaFileName}</span>
		</div>
		<div class="shared-body">
			{#each rows.shared as row, index (index)}
				{#if row.title}
					<h3 class="shared-group">{row.title}</h3>
				{:else if row.shared}
					<Field
						field={row.shared}
						scope="shared"
						value={valueOf(row.shared.name, "ru")}
						disabled={busy}
						{slug}
						actionLabel={row.shared.name === "repo"
							? "подтянуть с GitHub"
							: undefined}
						onaction={row.shared.name === "repo"
							? () => pullFromGithub("ru")
							: undefined}
						onchange={(next) => setValue(row.shared?.name ?? "", "ru", next)}
					/>
				{/if}
			{/each}
		</div>
	</section>

	{#if rows.local.length > 0}
		<section class="shared">
			<div class="shared-head">
				<h2>Локальное</h2>
				<span class="file-name">{localFileName}</span>
			</div>
			<p class="local-note">
				Файл не в гите: путь к клону есть только на этой машине.
			</p>
			<div class="shared-body">
				{#each rows.local as row, index (index)}
					{#if row.title}
						<h3 class="shared-group">{row.title}</h3>
					{:else if row.shared}
						<Field
							field={row.shared}
							scope="local"
							value={valueOf(row.shared.name, "ru")}
							disabled={busy}
							{slug}
							onchange={(next) => setValue(row.shared?.name ?? "", "ru", next)}
						/>
					{/if}
				{/each}
			</div>
		</section>
	{/if}

	<div class="pair">
		{#snippet fieldCell(field: FieldDef | undefined, lang: ContentLang)}
			<div class="cell">
				{#if field}
					<Field
						{field}
						scope={lang}
						value={valueOf(field.name, lang)}
						disabled={busy}
						{slug}
						onchange={(next) => setValue(field.name, lang, next)}
					/>
				{/if}
			</div>
		{/snippet}

		{#snippet copyArrows(name: string)}
			<div class="arrows">
				<button
					type="button"
					disabled={busy}
					title={`${fieldLabel(name)}: ${LANG_LABEL.ru} → ${LANG_LABEL.en}`}
					onclick={() => copyField(name, "ru", "en")}>→</button
				>
				<button
					type="button"
					disabled={busy}
					title={`${fieldLabel(name)}: ${LANG_LABEL.en} → ${LANG_LABEL.ru}`}
					onclick={() => copyField(name, "en", "ru")}>←</button
				>
			</div>
		{/snippet}

		<div class="pair-head">
			<h2>{LANG_LABEL.ru}</h2>
			<span class="pair-head-gap"></span>
			<h2 class="pair-head-en">{LANG_LABEL.en}</h2>
		</div>

		{#each rows.translated as row, index (index)}
			{#if row.title}
				<h2 class="row-head">{row.title}</h2>
			{:else if row.ru && row.en}
				{@render fieldCell(row.ru, "ru")}
				{@render copyArrows(row.ru.name)}
				{@render fieldCell(row.en, "en")}
			{:else}
				{@render fieldCell(row.ru ?? row.en, "ru")}
				{@render copyArrows((row.ru ?? row.en)?.name ?? "")}
				{@render fieldCell(undefined, "en")}
			{/if}
		{/each}

		{#if ghStatus}
			<p class="gh-status">{ghStatus}</p>
		{/if}
	</div>

	<section class="texts">
		<div class="texts-pair">
			{#snippet textColumn(lang: ContentLang, copyTo: ContentLang)}
				<div class="pair-col">
					<div class="pair-head">
						<h2>{LANG_LABEL[lang]}</h2>
						<div class="pair-tools">
							<button
								type="button"
								disabled={!canCopyText(copyTo) || busy}
								title={canCopyText(copyTo)
									? `скопировать текст ${LANG_LABEL[lang]} в ${LANG_LABEL[copyTo]}`
									: `${LANG_LABEL[copyTo]} не пуст — копирование затрёт текст`}
								onclick={() => copyText(lang, copyTo)}
								>{LANG_LABEL[lang]} → {LANG_LABEL[copyTo]}</button
							>
							<button
								type="button"
								class="danger"
								disabled={busy}
								onclick={() => requestClear(lang)}>очистить</button
							>
						</div>
					</div>
					<MarkdownField
						value={entry?.versions[lang].body ?? ""}
						disabled={busy}
						{slug}
						needsMoreMarker={type === "article"}
						onchange={(body) => setBody(lang, body)}
					/>
				</div>
			{/snippet}

			{@render textColumn("ru", "en")}
			{@render textColumn("en", "ru")}
		</div>

		<div class="save-row">
			<button type="button" class="primary" disabled={busy} onclick={saveBoth}
				>сохранить</button
			>
			{#if status}<span class="status">{status}</span>{/if}
		</div>
	</section>

	<ValidationPanel {report} />

	{#if clearing}
		<ConfirmModal
			title="Очистить текст?"
			body={`Текст версии ${LANG_LABEL[clearing]} станет пустым. Отменить это нельзя — файл на диске останется, пока не сохранишь.`}
			confirmLabel="да, очистить"
			disabled={busy}
			oncancel={() => (clearing = null)}
			onconfirm={doClear}
		/>
	{/if}

	<section class="slug-zone">
		<h2>Slug</h2>
		<p>
			Переименование меняет адрес на сайте: старые ссылки перестанут работать.
		</p>
		<div class="row">
			<input
				type="text"
				bind:value={renameTo}
				placeholder="my-slug"
				aria-invalid={!slugOk}
			/>
			<button type="button" onclick={suggestSlug}>из заголовка</button>
			<button
				type="button"
				disabled={!renameChanged || busy}
				onclick={doRename}
			>
				переименовать
			</button>
		</div>
		{#if renameTo && !slugOk}
			<p class="bad">Только a-z0-9 и дефисы, без пробелов и подчёркиваний.</p>
		{/if}
	</section>
</div>

<style>
	.unit {
		display: flex;
		flex-direction: column;
		gap: var(--gap-4);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
	}

	header h1 {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin: 0;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 17px;
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kind {
		font-family: var(--font-ui);
		font-size: var(--fs-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}

	.back {
		font-size: var(--fs-md);
		color: var(--text-dim);
		text-decoration: none;
	}

	.back:hover {
		color: var(--text);
	}

	.head-actions {
		display: flex;
		gap: var(--gap-2);
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: var(--gap-3);
		border: 1px solid #5c2f31;
		border-radius: var(--r-control);
		background: var(--danger-wash);
		font-size: var(--fs-md);
	}

	.confirm code {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	/*
 * Ровно две равные колонки: слева поля одного языка, справа другого. Полосы с
 * кнопками между колонками нет — она была третьей колонкой сетки и съедала
 * ширину у обеих, поэтому «половинки» не были половинками.
 */
	/*
 * Форма — таблица строк, а не две колонки полей. Каждая строка: RU слева, EN
 * справа, поэтому «теги» стоят на одной высоте с «тегами» второго языка.
 * Две независимые колонки здесь не годились: внутри каждой поля раскладывались
 * ещё раз и строки разъезжались.
 *
 * Три колонки, а не две: средняя узкая — под стрелки копирования этого поля.
 * Стрелки лежат между языками, поэтому нажатие читается однозначно: вправо —
 * RU в EN.
 */
	/*
	 * Базовые правила кнопки — первыми в файле: селекторы типа элемента должны
	 * идти раньше более специфичных, иначе stylelint ругается на порядок.
	 * Каскад от этого не меняется — специфичности для этого достаточно.
	 */
	button {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 12px;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.pair {
		/* Ширина колонки стрелок задана явно и используется ещё и в заголовке:
	   иначе колонка `auto` под метками схлопывалась в ноль и EN уезжал левее
	   своих полей. */
		--arrow-w: 30px;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--gap-3);
		row-gap: 0;
		align-items: start;
	}

	.row-head {
		grid-column: 1 / -1;
		margin: var(--gap-5) 0 var(--gap-2);
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent);
	}

	.row-head:first-of-type {
		margin-top: 0;
	}

	.cell {
		min-width: 0;
		padding: 13px 0;
		border-bottom: 1px solid var(--line);
	}

	.arrows {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding-top: 13px;
	}

	.arrows button {
		width: var(--arrow-w);
		height: 26px;
		padding: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		line-height: 1;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.pair-tools button {
		font-size: var(--fs-sm);
		padding: 4px 9px;
	}

	/*
	 * Общий hover идёт после всех частных правил кнопки: у него специфичность
	 * `button:hover:not(:disabled)`, а у `.arrows button:hover` — выше, поэтому
	 * стрелки перекрашиваются как надо независимо от порядка. stylelint просит
	 * специфичности не убывать, а этот порядок ещё и читается: сначала база,
	 * потом частные кнопки, потом состояния.
	 */
	button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}

	.arrows button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.arrows button:hover:not(:disabled) {
		color: var(--accent);
		background: var(--surface-3);
		border-color: var(--accent-dim);
	}

	/* Метки языков. Заголовок — сам элемент трёхколоночной сетки, поэтому без
	   `1 / -1` он занимал только первую колонку и EN уезжал в поле стрелок. */
	.pair-head {
		grid-column: 1 / -1;
		display: grid;
		/* Те же треки, что у формы: средняя колонка равна ширине стрелок,
		   поэтому метки стоят ровно над своими полями. */
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--gap-3);
		align-items: center;
		padding-bottom: var(--gap-3);
		border-bottom: 1px solid var(--line-strong);
	}

	.pair-head h2 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--text-faint);
	}

	.pair-head-en {
		grid-column: 3;
	}

	.pair-head-gap {
		grid-column: 2;
	}

	.pair-col {
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
		min-width: 0;
	}

	.pair-tools {
		display: flex;
		gap: var(--gap-2);
		margin-left: auto;
	}

	.gh-status {
		grid-column: 1 / -1;
		margin: var(--gap-3) 0 0;
		padding: var(--gap-2) 10px;
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		background: var(--accent-wash);
		font-size: var(--fs-sm);
		line-height: 1.6;
		color: var(--text-dim);
	}

	/*
 * Общий блок: поля, которые не переводятся. Правится один раз и пишется в оба
 * файла, поэтому здесь одна колонка на всю ширину, а не две — рядом с ними
 * нечего сравнивать.
 */
	.shared {
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
		padding: var(--gap-4);
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		background: var(--surface);
	}

	.shared-head {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		padding-bottom: var(--gap-2);
		border-bottom: 1px solid var(--line);
	}

	.shared-head h2 {
		margin: 0;
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent);
	}

	/* Имя файла рядом с заголовком: блок «Общее» правит не поля вообще, а
	   конкретный json, и без подписи это читается как «общее где-то». */
	.file-name {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.local-note {
		margin: 0;
		font-size: var(--fs-sm);
		line-height: 1.6;
		color: var(--text-faint);
	}

	.shared-body {
		display: grid;
		/* Две равные колонки: поля короткие, в одну они растягивались бы на весь
		   экран, и ввод становился бы неудобно широким. */
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: var(--gap-6);
		align-items: start;
	}

	.shared-group {
		grid-column: 1 / -1;
		margin: var(--gap-3) 0 0;
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-faint);
	}

	.shared-group:first-child {
		margin-top: 0;
	}

	/* Блок текста: те же две колонки и та же полоса копирования, что и у полей.
	 */
	.texts {
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
		padding: var(--gap-4);
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		background: var(--surface);
	}

	.texts-pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--gap-6);
		align-items: start;
	}

	.save-row {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		padding-top: var(--gap-2);
		flex-wrap: wrap;
	}

	.status {
		font-size: var(--fs-md);
		color: var(--text-dim);
	}

	.slug-zone {
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		padding: var(--gap-3);
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
		background: var(--surface);
	}

	.slug-zone h2 {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}

	.slug-zone p {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--text-dim);
	}

	.row {
		display: flex;
		gap: var(--gap-2);
		flex-wrap: wrap;
	}

	.row input {
		font: inherit;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		flex: 1;
		min-width: 180px;
		padding: 6px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.row input[aria-invalid="true"] {
		border-color: var(--danger);
	}

	.bad {
		color: var(--danger);
	}

	button.primary {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
		font-weight: 600;
	}

	button.primary:hover:not(:disabled) {
		background: #6ad68d;
		border-color: #6ad68d;
	}

	button.danger {
		color: var(--danger);
		background: transparent;
		border-color: #5c2f31;
	}

	button.danger:hover:not(:disabled) {
		color: var(--text);
		background: var(--danger-wash);
	}

	@media (width <= 1100px) {
		.pair,
		.texts-pair,
		.shared-body {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--gap-4);
		}

		.arrows {
			flex-direction: row;
			justify-content: end;
			padding: 0 var(--gap-2) var(--gap-2);
		}

		.row-head,
		.pair-head {
			grid-column: 1;
		}

		.pair-head-en {
			grid-column: 1;
		}
	}
</style>
