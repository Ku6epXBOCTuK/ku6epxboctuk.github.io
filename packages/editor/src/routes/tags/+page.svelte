<script lang="ts">
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";
	import ConfirmModal from "$lib/components/ConfirmModal.svelte";
	import RemoveScopes from "$lib/components/tags/RemoveScopes.svelte";
	import TagAdder from "$lib/components/tags/TagAdder.svelte";
	import TagEditRow from "$lib/components/tags/TagEditRow.svelte";
	import TagFilter from "$lib/components/tags/TagFilter.svelte";
	import TagViewRow from "$lib/components/tags/TagViewRow.svelte";
	import type { TagDropScope, TagPlan, TagRow } from "$lib/types";

	/*
	 * Теги живут в двух местах:
	 *
	 * - список — какие теги вообще существуют, его можно пополнять заранее;
	 * - записи — где теги реально стоят.
	 *
	 * Поэтому удаление и переименование спрашивают оба места отдельно: убрать
	 * тег из списка и стереть его из пятидесяти постов — разные вещи, и молча
	 * делать второе вместо первого нельзя.
	 */

	let rows = $state<TagRow[]>([]);
	let query = $state("");
	let busy = $state(false);
	let status = $state("");

	let newTag = $state("");
	let editing = $state("");
	let draft = $state("");
	let plan = $state<TagPlan | null>(null);
	let pending = $state<TagRow | null>(null);
	let removing = $state<TagRow | null>(null);

	let dropScope = $state<TagDropScope>("both");

	const visible = $derived(
		rows.filter((row) =>
			query.trim() === "" ? true : row.tag.includes(query.trim().toLowerCase()),
		),
	);

	const draftError = $derived(draft ? tagError(normalizeTag(draft)) : null);
	const newTagError = $derived(newTag ? tagError(normalizeTag(newTag)) : null);

	async function load() {
		try {
			const res = await fetch("/api/tags");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as { tags: TagRow[] };
			rows = data.tags;
		} catch (err) {
			status = (err as Error).message;
		}
	}

	$effect(() => {
		void load();
	});

	function startEdit(row: TagRow) {
		editing = row.tag;
		draft = row.tag;
		plan = null;
		status = "";
	}

	function cancelEdit() {
		editing = "";
		draft = "";
		plan = null;
	}

	function onDraft(next: string) {
		draft = next;
		void checkPlan();
	}

	/**
	 * Что будет, если записать это имя. Спрашиваем у сервера: он знает, есть ли
	 * такой тег сейчас, и это снимает вопрос «а не сольётся ли что-нибудь».
	 */
	async function checkPlan() {
		if (!editing) return;

		const target = normalizeTag(draft);
		if (!target || tagError(target) || target === editing) {
			plan = null;
			return;
		}

		try {
			const res = await fetch(
				`/api/tags/plan?from=${encodeURIComponent(editing)}&to=${encodeURIComponent(target)}`,
			);
			plan = res.ok ? ((await res.json()) as { plan: TagPlan }).plan : null;
		} catch {
			plan = null;
		}
	}

	async function send(method: "PUT" | "DELETE", body: unknown) {
		const res = await fetch("/api/tags", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = (await res.json()) as { error?: string; changed?: number };
		if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
		return data.changed ?? 0;
	}

	/** Завести тег заранее, до первого поста с ним. */
	async function addNew() {
		/*
		 * Вход без `busy`: инпут не глушится на время запроса (задизейбленный
		 * элемент теряет фокус, и следующий тег подряд не ввести), поэтому
		 * повторный Enter отсекаем здесь.
		 */
		if (busy) return;

		const tag = normalizeTag(newTag);
		if (!tag || tagError(tag)) return;
		if (rows.some((row) => row.tag === tag)) {
			status = `«${tag}» уже есть`;
			return;
		}

		busy = true;
		status = "";
		try {
			await fetch("/api/tags", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tag }),
			});
			newTag = "";
			await load();
			status = `${tag} добавлен`;
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function commitRename(row: TagRow) {
		const target = normalizeTag(draft);
		if (!target || tagError(target) || target === row.tag) {
			cancelEdit();
			return;
		}

		// Слияние спрашиваем отдельно: переименовать и склеить два тега —
		// разные действия, и второе ещё и необратимо.
		if (plan?.merge) {
			pending = row;
			return;
		}

		await applyRename(row, target);
	}

	async function applyRename(row: TagRow, target: string) {
		// Как и в `addNew`: инпут не глушится, повторный Enter отсекаем здесь.
		if (busy) return;

		busy = true;
		status = "";
		try {
			// Список и записи — вместе: если тег новый, в списке его тоже не
			// было, а если старый, то он в обоих местах сразу.
			const changed = await send("PUT", {
				tag: row.tag,
				to: target,
				inList: true,
				inContent: row.count > 0,
			});
			cancelEdit();
			pending = null;
			await load();
			status = `${row.tag} → ${target}: ${changed}`;
		} catch (err) {
			status = (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function doMerge() {
		const row = pending;
		if (!row) return;
		await applyRename(row, normalizeTag(draft));
	}

	async function doRemove() {
		const row = removing;
		if (!row) return;

		busy = true;
		status = "";
		try {
			const changed = await send("DELETE", {
				tag: row.tag,
				inList: dropScope !== "content",
				inContent: dropScope !== "list",
			});
			removing = null;
			await load();
			status =
				dropScope === "content"
					? `${row.tag} убран из ${changed}`
					: `${row.tag} убран из списка`;
		} catch (err) {
			status = (err as Error).message;
			removing = null;
		} finally {
			busy = false;
		}
	}
</script>

<section class="tags-page">
	<header>
		<h1>Теги</h1>
	</header>

	<TagAdder
		value={newTag}
		{busy}
		error={newTagError}
		oninput={(next) => (newTag = next)}
		onadd={addNew}
	/>

	{#if rows.length === 0}
		<p class="empty">Тегов пока нет — добавь их в форме единицы.</p>
	{:else}
		<TagFilter
			value={query}
			found={visible.length}
			total={rows.length}
			oninput={(next) => (query = next)}
		/>

		{#if visible.length === 0}
			<p class="empty">Ничего не нашлось.</p>
		{:else}
			<ul>
				{#each visible as row (row.tag)}
					<li>
						{#if editing === row.tag}
							<TagEditRow
								{draft}
								error={draftError}
								{plan}
								{busy}
								ondraft={onDraft}
								oncommit={() => commitRename(row)}
								oncancel={cancelEdit}
							/>
						{:else}
							<TagViewRow
								{row}
								{busy}
								onedit={() => startEdit(row)}
								onremove={() => (removing = row)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	{#if status}
		<p class="status">{status}</p>
	{/if}
</section>

{#if pending && plan}
	<ConfirmModal
		title="Слить два тега?"
		body={`«${pending.tag}» исчезнет, а «${plan.to}» останется в ${plan.resultCount} ${plan.resultCount === 1 ? "записи" : "записях"}.`}
		confirmLabel="да, слить"
		disabled={busy}
		oncancel={() => (pending = null)}
		onconfirm={doMerge}
	/>
{/if}

{#if removing}
	<RemoveScopes
		row={removing}
		value={dropScope}
		onchange={(next) => (dropScope = next)}
	/>
	<ConfirmModal
		title="Убрать тег?"
		body={dropScope === "list"
			? `Тег перестанет предлагаться, записи останутся как были.`
			: `Тег исчезнет из ${removing.count} ${removing.count === 1 ? "записи" : "записей"}.`}
		confirmLabel="да, убрать"
		disabled={busy}
		oncancel={() => (removing = null)}
		onconfirm={doRemove}
	/>
{/if}

<style>
	.tags-page {
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
	}

	h1 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		font-weight: 600;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		padding: var(--gap-1) var(--gap-3);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	.empty,
	.status {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--text-faint);
	}

	.status {
		color: var(--text-dim);
	}
</style>
