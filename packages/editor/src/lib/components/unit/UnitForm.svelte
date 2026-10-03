<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		fieldScope,
		fieldsByScope,
		slugFromTitle,
		type ContentLang,
		type ContentType,
		type Entry,
	} from "@ku6epxboctuk/content-core/shared";
	import type { EntryDetail, ValidationReport } from "$lib/types";
	import { fieldRows } from "$lib/groups";
	import type { GitHubProjectPayload } from "../../../routes/api/github-project/+server";
	import ConfirmModal from "../ConfirmModal.svelte";
	import ValidationPanel from "../ValidationPanel.svelte";
	import ScopePanel from "./ScopePanel.svelte";
	import SlugZone from "./SlugZone.svelte";
	import TextsPanel from "./TextsPanel.svelte";
	import TranslatedFields from "./TranslatedFields.svelte";
	import UnitHeader from "./UnitHeader.svelte";

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
	let clearing = $state<ContentLang | null>(null);

	// SvelteKit переиспользует компонент при смене slug: засеваем состояние
	// из данных только когда сменилась единица, а не на каждый рендер.
	let seeded = "";

	$effect(() => {
		if (seeded === slug) return;
		seeded = slug;
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
		status = "";
		ghStatus = "";
	});

	const rows = $derived(
		fieldRows(
			type,
			fieldsByScope(type, "translatable"),
			fieldsByScope(type, "translatable"),
		),
	);

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

	function setBody(lang: ContentLang, body: string) {
		if (entry) entry.versions[lang].body = body;
	}

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

	function copyText(from: ContentLang, to: ContentLang) {
		if (!entry || entry.versions[to].body.trim() !== "") return;
		entry.versions[to].body = entry.versions[from].body;
		clearing = null;
		status = `${LANG_LABEL[from]} → ${LANG_LABEL[to]}`;
	}

	function doClear() {
		const lang = clearing;
		if (!lang || !entry) return;
		entry.versions[lang].body = "";
		clearing = null;
		status = `${LANG_LABEL[lang]} очищен.`;
	}

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

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
	{#key slug}
		<UnitHeader {type} {slug} {busy} ondelete={doDelete} />
	{/key}

	<ScopePanel
		title="Общее"
		rows={rows.shared}
		scope="shared"
		{busy}
		{slug}
		value={(name) => valueOf(name, "ru")}
		onchange={(name, next) => setValue(name, "ru", next)}
		actionFor={(name) =>
			name === "repo"
				? { label: "подтянуть с GitHub", run: () => pullFromGithub("ru") }
				: undefined}
	/>

	{#if rows.local.length > 0}
		<ScopePanel
			title="Локальное"
			rows={rows.local}
			scope="local"
			{busy}
			{slug}
			value={(name) => valueOf(name, "ru")}
			onchange={(name, next) => setValue(name, "ru", next)}
		/>
	{/if}

	<TranslatedFields
		rows={rows.translated}
		{busy}
		{slug}
		{ghStatus}
		value={valueOf}
		onchange={setValue}
		{fieldLabel}
		oncopyfield={copyField}
	/>

	<TextsPanel
		{entry}
		{type}
		{slug}
		{busy}
		{status}
		onbody={setBody}
		oncopytext={copyText}
		onclear={(lang) => (clearing = lang)}
		onsave={saveBoth}
	/>

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

	<SlugZone
		{renameFrom}
		value={renameTo}
		{busy}
		onsuggest={suggestSlug}
		onrename={doRename}
		onchange={(next) => (renameTo = next)}
	/>
</div>

<style>
	.unit {
		display: flex;
		flex-direction: column;
		gap: var(--gap-4);
	}
</style>
