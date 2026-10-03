<script lang="ts">
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";
	import ConfirmModal from "$lib/components/ConfirmModal.svelte";

	/*
	 * Список тегов: что чем помечено, переименование и удаление.
	 *
	 * Отдельного списка тегов не существует — он собирается из контента, поэтому
	 * и удаление здесь означает «убрать отовсюду». Число в скобках это единиц, а
	 * не файлов: одна запись может стоять у поста, статьи и проекта.
	 */

	interface Unit {
		type: string;
		slug: string;
	}

	interface TagRow {
		tag: string;
		count: number;
		units: Unit[];
	}

	interface Plan {
		from: string;
		to: string;
		exists: boolean;
		merge: boolean;
		affected: number;
		duplicates: number;
		resultCount: number;
	}

	let rows = $state<TagRow[]>([]);
	let query = $state("");
	let busy = $state(false);
	let status = $state("");

	let editing = $state("");
	let draft = $state("");
	let plan = $state<Plan | null>(null);
	let pending = $state<TagRow | null>(null);
	let removing = $state<TagRow | null>(null);

	const visible = $derived(
		rows.filter((row) =>
			query.trim() === "" ? true : row.tag.includes(query.trim().toLowerCase()),
		),
	);

	const draftError = $derived(draft ? tagError(normalizeTag(draft)) : null);

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
			plan = res.ok ? ((await res.json()) as { plan: Plan }).plan : null;
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
		busy = true;
		status = "";
		try {
			const changed = await send("PUT", { tag: row.tag, to: target });
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
			const changed = await send("DELETE", { tag: row.tag });
			removing = null;
			await load();
			status = `${row.tag} убран из ${changed}`;
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
		<input
			type="text"
			bind:value={query}
			placeholder="найти тег"
			aria-label="поиск тега"
		/>
	</header>

	{#if rows.length === 0}
		<p class="empty">Тегов пока нет — добавь их в форме единицы.</p>
	{:else if visible.length === 0}
		<p class="empty">Ничего не нашлось.</p>
	{:else}
		<ul>
			{#each visible as row (row.tag)}
				<li>
					{#if editing === row.tag}
						<div class="edit-row">
							<input
								type="text"
								class="edit"
								value={draft}
								aria-invalid={Boolean(draftError)}
								disabled={busy}
								oninput={(e) => onDraft(e.currentTarget.value)}
								onkeydown={(e) => {
									if (e.key === "Enter") commitRename(row);
									if (e.key === "Escape") cancelEdit();
								}}
							/>
							<button
								type="button"
								disabled={busy}
								onclick={() => commitRename(row)}
							>
								{plan?.merge ? "слить" : "ок"}
							</button>
							<button type="button" disabled={busy} onclick={cancelEdit}>
								отмена
							</button>
							{#if draftError}
								<span class="note bad">{draftError}</span>
							{:else if plan?.merge}
								<span class="note">
									тег «{plan.to}» уже есть — сольются, останется в
									{plan.resultCount}
									{plan.resultCount === 1 ? "записи" : "записях"}
									{#if plan.duplicates > 0}
										, из них {plan.duplicates} с дублями
									{/if}
								</span>
							{/if}
						</div>
					{:else}
						<button
							type="button"
							class="name"
							disabled={busy}
							onclick={() => startEdit(row)}
							title="переименовать"
						>
							{row.tag}
						</button>
						<span class="count">{row.count}</span>
						<span class="where">
							{row.units.map((unit) => `${unit.type}/${unit.slug}`).join(", ")}
						</span>
						<button
							type="button"
							class="danger"
							disabled={busy}
							onclick={() => (removing = row)}
						>
							убрать
						</button>
					{/if}
				</li>
			{/each}
		</ul>
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
	<ConfirmModal
		title="Убрать тег везде?"
		body={`Тег «${removing.tag}» исчезнет из ${removing.count} ${removing.count === 1 ? "записи" : "записей"}.`}
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
		font-size: 17px;
		font-weight: 600;
	}

	header input,
	.edit {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	header input {
		flex: 1;
		min-width: 160px;
	}

	.edit {
		max-width: 220px;
	}

	.edit[aria-invalid="true"] {
		border-color: var(--danger);
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
		padding: 6px var(--gap-3);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	.name {
		font-family: var(--font-mono);
		background: transparent;
		border: none;
		padding: 2px 0;
		color: var(--accent);
		min-width: 140px;
		text-align: left;
	}

	.count {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-dim);
		min-width: 20px;
	}

	.where {
		flex: 1;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-faint);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	button {
		font: inherit;
		font-size: var(--fs-md);
		padding: 5px 10px;
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

	button.danger {
		color: var(--danger);
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

	/*
	 * Правка занимает всю ширину строки: пока идёт предпросмотр, важно видеть
	 * и поле, и то, что из этого выйдет, а не гадать по одному слову.
	 */
	.edit-row {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex: 1;
		flex-wrap: wrap;
	}

	.note {
		font-size: var(--fs-sm);
		color: var(--warn);
	}

	.note.bad {
		color: var(--danger);
	}
</style>
