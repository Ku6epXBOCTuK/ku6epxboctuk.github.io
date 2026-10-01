<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		FIELDS,
		defaultsFor,
		isValidSlug,
		slugFromTitle,
		type ContentLang,
		type ContentType,
	} from "@ku6epxboctuk/content-core/shared";
	import type { UnitDetail, UnitVersion, ValidationReport } from "$lib/types";
	import type { GitHubProjectPayload } from "../../routes/api/github-project/+server";
	import Field from "./Field.svelte";
	import MarkdownField from "./MarkdownField.svelte";
	import ValidationPanel from "./ValidationPanel.svelte";

	interface Props {
		type: ContentType;
		slug: string;
		detail: UnitDetail;
	}

	let { type, slug, detail }: Props = $props();

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };
	const LANGS: ContentLang[] = ["ru", "en"];
	const TRANSLATION_PENDING = "перевод в работе.";

	let current = $state<ContentLang>("ru");
	let ru = $state<UnitVersion | null>(null);
	let en = $state<UnitVersion | null>(null);
	let report = $state<ValidationReport | null>(null);
	let status = $state("");
	let ghStatus = $state("");
	let busy = $state(false);

	let renameFrom = $state("");
	let renameTo = $state("");
	let confirmingDelete = $state(false);

	// SvelteKit переиспользует компонент при смене slug, поэтому засеваем
	// состояние из данных только когда сменилась единица, а не на каждый рендер.
	let seeded = "";

	$effect(() => {
		if (seeded === slug) return;
		seeded = slug;
		current = "ru";
		ru = detail.ru;
		en = detail.en;
		report = detail.validation;
		renameFrom = slug;
		renameTo = slug;
		confirmingDelete = false;
		status = "";
		ghStatus = "";
	});

	const version = $derived(current === "ru" ? ru : en);
	const fields = $derived(
		FIELDS[type].filter((field) => {
			if (field.hidden || field.auto) return false;
			return !field.only || field.only === current;
		}),
	);
	const slugOk = $derived(isValidSlug(renameTo));
	const renameChanged = $derived(renameTo !== renameFrom && slugOk);

	function versionFor(lang: ContentLang): UnitVersion | null {
		return lang === "ru" ? ru : en;
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
			if (field.only && field.only !== lang) delete frontmatter[field.name];
		}

		return { frontmatter, body: data.body };
	}

	function blank(): UnitVersion {
		return {
			frontmatter: defaultsFor(type),
			body: "",
		};
	}

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	async function save(lang: ContentLang): Promise<boolean> {
		if (!versionFor(lang)) {
			status = `Нет версии ${LANG_LABEL[lang]}.`;
			return false;
		}

		busy = true;
		try {
			const res = await fetch(`/api/units/${type}/${slug}/${lang}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payloadFor(lang)),
			});
			const json = await readJson(res);
			if (!res.ok) {
				status = json.error ?? `HTTP ${res.status}`;
				return false;
			}
			report = json.validation;
			status = `Сохранено ${LANG_LABEL[lang]}.`;
			return true;
		} catch (err) {
			status = (err as Error).message;
			return false;
		} finally {
			busy = false;
		}
	}

	async function create(lang: ContentLang) {
		busy = true;
		try {
			const from = lang === "en" ? ru : null;
			const payload: UnitVersion = from
				? {
						frontmatter: { ...from.frontmatter, needs_translation: true },
						body: TRANSLATION_PENDING,
					}
				: blank();

			const res = await fetch(`/api/units/${type}/${slug}/${lang}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await readJson(res);
			if (!res.ok) {
				status = json.error ?? `HTTP ${res.status}`;
				return;
			}
			if (lang === "ru") ru = payload;
			else en = payload;
			report = json.validation;
			status = `Создана версия ${LANG_LABEL[lang]}.`;
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	function setField(key: string, value: unknown) {
		const data = current === "ru" ? ru : en;
		if (!data) return;
		const next = { ...data.frontmatter };
		const empty =
			value === undefined ||
			value === "" ||
			(Array.isArray(value) && value.length === 0);
		if (empty) delete next[key];
		else next[key] = value;
		if (current === "ru") ru = { ...data, frontmatter: next };
		else en = { ...data, frontmatter: next };
	}

	function setBody(body: string) {
		const data = current === "ru" ? ru : en;
		if (!data) return;
		if (current === "ru") ru = { ...data, body };
		else en = { ...data, body };
	}

	async function saveBoth() {
		const a = await save("ru");
		const b = await save("en");
		if (a && b) status = "Обе версии сохранены.";
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
	async function pullFromGithub() {
		const data = versionFor(current);
		const url = String(data?.frontmatter.repo ?? "").trim();
		if (!data || !url) {
			ghStatus = "Сначала впиши ссылку на репозиторий.";
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
			if (current === "ru") ru = { frontmatter: next, body };
			else en = { frontmatter: next, body };

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
		<h1>{type} / {slug}</h1>
		<div class="head-actions">
			<button type="button" disabled={busy} onclick={saveBoth}
				>сохранить обе</button
			>
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

	<div class="tabs">
		{#each LANGS as lang (lang)}
			<button
				type="button"
				class="tab"
				class:active={current === lang}
				data-missing={!versionFor(lang)}
				onclick={() => (current = lang)}
			>
				{LANG_LABEL[lang]}
				{#if !versionFor(lang)}<span class="dot" title="нет файла"></span>{/if}
			</button>
		{/each}
	</div>

	{#if !version}
		<div class="create">
			<p>
				Версии {LANG_LABEL[current]} ещё нет.
				{#if current === "en" && ru}
					Кнопка создаст <code>index.en.md</code> из русской версии с пометкой
					<code>needs_translation</code>.
				{/if}
			</p>
			<button type="button" disabled={busy} onclick={() => create(current)}>
				{current === "en" && ru
					? "Скопировать из RU"
					: `Создать ${LANG_LABEL[current]}`}
			</button>
		</div>
	{:else}
		{#each fields as field (field.name)}
			<Field
				{field}
				value={version.frontmatter[field.name]}
				disabled={busy}
				{slug}
				actionLabel={field.name === "repo" ? "подтянуть с GitHub" : undefined}
				onaction={field.name === "repo" ? pullFromGithub : undefined}
				onchange={(next) => setField(field.name, next)}
			/>
		{/each}

		{#if ghStatus}
			<p class="gh-status">{ghStatus}</p>
		{/if}

		<div class="body">
			<span class="body-label">Текст</span>
			<MarkdownField
				value={version.body}
				disabled={busy}
				{slug}
				needsMoreMarker={type === "article"}
				onchange={setBody}
			/>
		</div>

		<div class="save-row">
			<button type="button" disabled={busy} onclick={() => save(current)}>
				сохранить {LANG_LABEL[current]}
			</button>
			{#if status}<span class="status">{status}</span>{/if}
		</div>
	{/if}

	<ValidationPanel {report} />

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
		gap: 14px;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	header h1 {
		flex: 1;
		margin: 0;
		font-size: 17px;
	}

	.back {
		font-size: 13px;
		color: #555;
	}

	.head-actions {
		display: flex;
		gap: 8px;
	}

	.tabs {
		display: flex;
		gap: 6px;
		border-bottom: 1px solid #e5e5e5;
	}

	.tab {
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		padding: 7px 14px;
		border: 1px solid #ddd;
		border-bottom: none;
		border-radius: 6px 6px 0 0;
		background: #f7f7f7;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tab.active {
		background: #fff;
		border-color: #bbb;
		color: #000;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d08a00;
	}

	.create {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px;
		border: 1px dashed #ccc;
		border-radius: 6px;
	}

	.create p,
	.slug-zone p {
		margin: 0;
		font-size: 13px;
		color: #555;
	}

	.body {
		padding: 12px 0;
		border-bottom: 1px solid #eee;
	}

	.body-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: #333;
		margin-bottom: 4px;
	}

	.save-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.status {
		font-size: 12px;
		color: #555;
	}

	.gh-status {
		margin: 0;
		padding: 8px 10px;
		border: 1px solid #d8e2d0;
		border-radius: 5px;
		background: #f6faf4;
		font-size: 12px;
		color: #46543d;
	}

	.slug-zone {
		border: 1px solid #e6d5d5;
		border-radius: 6px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.slug-zone h2 {
		margin: 0;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #7a2020;
	}

	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.row input {
		font: inherit;
		flex: 1;
		min-width: 180px;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.row input[aria-invalid="true"] {
		border-color: #b00020;
	}

	.bad {
		color: #b00020;
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 10px 12px;
		border: 1px solid #e0c0c0;
		border-radius: 6px;
		background: #fdf5f5;
		font-size: 13px;
	}

	button {
		font: inherit;
		font-size: 13px;
		padding: 6px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		background: #fff;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	button.danger {
		border-color: #c99;
		color: #a11;
	}
</style>
