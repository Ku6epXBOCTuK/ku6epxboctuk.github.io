<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		FIELDS,
		isValidSlug,
		slugFromTitle,
		type ContentLang,
		type ContentType,
		type FieldDef,
	} from "@ku6epxboctuk/content-core/shared";
	import type { UnitDetail, UnitVersion, ValidationReport } from "$lib/types";
	import { fieldRows } from "$lib/groups";
	import type { GitHubProjectPayload } from "../../routes/api/github-project/+server";
	import Field from "./Field.svelte";
	import MarkdownField from "./MarkdownField.svelte";
	import ValidationPanel from "./ValidationPanel.svelte";
	import ConfirmModal from "./ConfirmModal.svelte";

	interface Props {
		type: ContentType;
		slug: string;
		detail: UnitDetail;
	}

	let { type, slug, detail }: Props = $props();

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };
	const LANGS: ContentLang[] = ["ru", "en"];

	let ru = $state<UnitVersion | null>(null);
	let en = $state<UnitVersion | null>(null);
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
		ru = detail.ru;
		en = detail.en;
		report = detail.validation;
		renameFrom = slug;
		renameTo = slug;
		confirmingDelete = false;
		status = "";
		ghStatus = "";
	});

	/**
	 * Поля языка. `only` убирает поле из чужой колонки: `path` описывает клон на
	 * машине, и в EN ему не место — там такую копию всё равно вычистили бы при
	 * сохранении, то есть человек бы правил поле, которое молча пропадёт.
	 */
	function fieldsFor(lang: ContentLang): FieldDef[] {
		return FIELDS[type].filter((field) => {
			if (field.hidden || field.auto || field.shared) return false;
			return !field.only || field.only === lang;
		});
	}

	const sharedFields = $derived(
		FIELDS[type].filter(
			(field) => field.shared && !field.hidden && !field.auto,
		),
	);

	const rows = $derived(fieldRows(type, fieldsFor("ru"), fieldsFor("en")));

	/**
	 * Общие поля живут в одном состоянии на оба языка. Берём из RU: он есть
	 * всегда, и первым делом должен быть правдой для всех.
	 */
	function sharedValue(name: string): unknown {
		return ru?.frontmatter[name];
	}

	function setShared(name: string, value: unknown) {
		const empty =
			value === undefined ||
			value === "" ||
			(Array.isArray(value) && value.length === 0);

		for (const lang of LANGS) {
			const data = versionFor(lang);
			if (!data) continue;
			const frontmatter = { ...data.frontmatter };
			if (empty) delete frontmatter[name];
			else frontmatter[name] = value;
			setVersion(lang, { ...data, frontmatter });
		}
	}

	const slugOk = $derived(isValidSlug(renameTo));
	const renameChanged = $derived(renameTo !== renameFrom && slugOk);

	function versionFor(lang: ContentLang): UnitVersion | null {
		return lang === "ru" ? ru : en;
	}

	function setVersion(lang: ContentLang, next: UnitVersion) {
		if (lang === "ru") ru = next;
		else en = next;
	}

	/**
	 * Поля с `only` принадлежат одному языку. Если EN получила `path` при
	 * копировании из RU, при сохранении вычищаем — иначе в index.en.md
	 * появится вторая копия факта о машине, которая со временем разъедется.
	 */
	function payloadFor(lang: ContentLang): UnitVersion {
		const data = versionFor(lang);
		if (!data) throw new Error(`Нет версии ${lang}`);

		const frontmatter = { ...data.frontmatter };
		for (const field of FIELDS[type]) {
			// `only` сильнее `shared`: путь к клону — общий по смыслу (правится
			// один раз), но в EN ему не место. Сначала вычищаем чужое поле, иначе
			// шаг ниже вернул бы его обратно из RU.
			if (field.only && field.only !== lang) {
				delete frontmatter[field.name];
				continue;
			}

			// Остальные общие берём из RU — единственного источника правды. Так в
			// оба файла попадёт одно значение, даже если EN правили в старой схеме.
			if (field.shared) {
				const value = ru?.frontmatter[field.name];
				if (value === undefined || value === "") delete frontmatter[field.name];
				else frontmatter[field.name] = value;
			}
		}

		return { frontmatter, body: data.body };
	}

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	async function saveLang(lang: ContentLang): Promise<boolean> {
		const res = await fetch(`/api/units/${type}/${slug}/${lang}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payloadFor(lang)),
		});
		const json = await readJson(res);
		if (!res.ok) {
			status = `${LANG_LABEL[lang]}: ${json.error ?? `HTTP ${res.status}`}`;
			return false;
		}
		report = json.validation;
		return true;
	}

	function setField(lang: ContentLang, key: string, value: unknown) {
		const data = versionFor(lang);
		if (!data) return;
		const next = { ...data.frontmatter };
		const empty =
			value === undefined ||
			value === "" ||
			(Array.isArray(value) && value.length === 0);
		if (empty) delete next[key];
		else next[key] = value;
		setVersion(lang, { ...data, frontmatter: next });
	}

	function setBody(lang: ContentLang, body: string) {
		const data = versionFor(lang);
		if (!data) return;
		setVersion(lang, { ...data, body });
	}

	/**
	 * Копия одного поля из одного языка в другой. Не тихо: пустое значение в
	 * источнике стирает поле в цели, а копия поверх непустой цели — это
	 * осознанное действие, поэтому кнопка на каждое поле своя и подписана.
	 */
	function copyField(name: string, from: ContentLang, to: ContentLang) {
		const source = versionFor(from);
		const target = versionFor(to);
		if (!source || !target) return;

		const frontmatter = { ...target.frontmatter };
		const value = source.frontmatter[name];

		if (value === undefined) delete frontmatter[name];
		else frontmatter[name] = value;

		setVersion(to, { ...target, frontmatter });
		status = `${fieldLabel(name)}: ${LANG_LABEL[from]} → ${LANG_LABEL[to]}`;
	}

	function fieldLabel(name: string): string {
		return FIELDS[type].find((field) => field.name === name)?.label ?? name;
	}

	/**
	 * Копия общего поля не нужна: оно и так одно. А вот расхождение на диске,
	 * оставшееся от старой схемы, надо свести к одному значению.
	 */
	async function alignShared() {
		const stale: string[] = [];
		for (const field of sharedFields) {
			const value = ru?.frontmatter[field.name];
			const other = en?.frontmatter[field.name];
			if (JSON.stringify(value) !== JSON.stringify(other)) {
				stale.push(field.label);
				setShared(field.name, value);
			}
		}
		if (stale.length === 0) return;
		await saveBoth();
		status = `Сведено в оба файла: ${stale.join(", ")}`;
	}

	/**
	 * Копия текста. Молча затирать перевод нельзя, поэтому кнопка активна, пока
	 * в цели пусто.
	 */
	function canCopyText(to: ContentLang): boolean {
		const target = versionFor(to);
		return !target || target.body.trim() === "";
	}

	function copyText(from: ContentLang, to: ContentLang) {
		const source = versionFor(from);
		const target = versionFor(to);
		if (!source || !target || !canCopyText(to)) return;
		setBody(to, source.body);
		clearing = null;
		status = `${LANG_LABEL[from]} → ${LANG_LABEL[to]}`;
	}

	function requestClear(lang: ContentLang) {
		clearing = lang;
	}

	function doClear() {
		const lang = clearing;
		if (!lang) return;
		setBody(lang, "");
		clearing = null;
		status = `${LANG_LABEL[lang]} очищен.`;
	}

	/**
	 * Единица — это два файла, а не два независимых документа. Сохраняются
	 * вместе: кнопка «сохранить RU» была ловушкой, где перевод остаётся на
	 * диске старым, а человек уверен, что работа ушла в git.
	 */
	async function saveBoth() {
		busy = true;
		status = "";
		try {
			const results: boolean[] = [];
			for (const lang of LANGS) results.push(await saveLang(lang));

			if (results.every(Boolean)) status = "Сохранено.";
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
			const res = await fetch(`/api/units/${type}/${renameFrom}`, {
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
			const res = await fetch(`/api/units/${type}/${slug}`, {
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
		const guess = slugFromTitle(String(ru?.frontmatter.title ?? ""));
		if (guess) renameTo = guess;
	}

	/**
	 * Дозаполнение из GitHub. Заполняем только пустые поля: ручное не трогаем,
	 * а что не тронули — говорим, чтобы не было сюрпризов.
	 */
	async function pullFromGithub(lang: ContentLang) {
		const data = versionFor(lang);
		const url = String(data?.frontmatter.repo ?? "").trim();
		if (!data || !url) {
			ghStatus = `${LANG_LABEL[lang]}: впиши ссылку на репозиторий.`;
			return;
		}

		busy = true;
		ghStatus = "Тяну с GitHub…";
		try {
			const res = await fetch("/api/github-project", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url, image: !data.frontmatter.image }),
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
			const next = { ...data.frontmatter };

			for (const [key, incoming] of Object.entries(json.frontmatter)) {
				if (incoming === undefined || incoming === null || incoming === "")
					continue;

				const existing = next[key];
				const empty =
					existing === undefined ||
					existing === null ||
					existing === "" ||
					(Array.isArray(existing) && existing.length === 0);

				if (empty) {
					next[key] = incoming;
					filled.push(key);
				} else {
					skipped.push(key);
				}
			}

			if (filled.length === 0) {
				ghStatus = "Заполнять нечего: все поля уже есть.";
				return;
			}

			const body = data.body.trim() ? data.body : json.body;
			setVersion(lang, { frontmatter: next, body });

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
			<button type="button" disabled={busy} onclick={alignShared}
				>свести в оба файла</button
			>
		</div>
		<div class="shared-body">
			{#each rows.shared as row, index (index)}
				{#if row.title}
					<h3 class="shared-group">{row.title}</h3>
				{:else if row.shared}
					<Field
						field={row.shared}
						scope="shared"
						value={sharedValue(row.shared.name)}
						disabled={busy}
						{slug}
						actionLabel={row.shared.name === "repo"
							? "подтянуть с GitHub"
							: undefined}
						onaction={row.shared.name === "repo"
							? () => pullFromGithub("ru")
							: undefined}
						onchange={(next) => setShared(row.shared?.name ?? "", next)}
					/>
				{/if}
			{/each}
		</div>
	</section>

	<div class="pair">
		{#snippet fieldCell(field: FieldDef | undefined, lang: ContentLang)}
			<div class="cell">
				{#if field}
					<Field
						{field}
						scope={lang}
						value={versionFor(lang)?.frontmatter[field.name]}
						disabled={busy}
						{slug}
						actionLabel={field.name === "repo"
							? "подтянуть с GitHub"
							: undefined}
						onaction={field.name === "repo"
							? () => pullFromGithub(lang)
							: undefined}
						onchange={(next) => setField(lang, field.name, next)}
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
						value={versionFor(lang)?.body ?? ""}
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

	.arrows button:hover:not(:disabled) {
		color: var(--accent);
		background: var(--surface-3);
		border-color: var(--accent-dim);
	}

	.arrows button:disabled {
		opacity: 0.4;
		cursor: default;
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

	.pair-tools button {
		font-size: var(--fs-sm);
		padding: 4px 9px;
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

	.shared-head button {
		margin-left: auto;
		font-size: var(--fs-sm);
		padding: 4px 10px;
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

	button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
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
