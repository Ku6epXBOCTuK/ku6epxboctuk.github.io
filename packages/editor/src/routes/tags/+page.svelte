<script lang="ts">
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";
	import ConfirmModal from "$lib/components/ConfirmModal.svelte";

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

	interface Unit {
		type: string;
		slug: string;
	}

	interface TagRow {
		tag: string;
		count: number;
		units: Unit[];
		/** Есть ли тег в списке `tags.json`. */
		listed: boolean;
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

	let newTag = $state("");
	let editing = $state("");
	let draft = $state("");
	let plan = $state<Plan | null>(null);
	let pending = $state<TagRow | null>(null);
	let removing = $state<TagRow | null>(null);

	/** Что удаляем из удаляемой записи: из списка, из контента или и то и другое. */
	let dropScope = $state<"list" | "content" | "both">("both");

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

	<div class="adder">
		<input
			type="text"
			value={newTag}
			placeholder="новый тег"
			aria-label="новый тег"
			aria-invalid={Boolean(newTagError)}
			oninput={(e) => (newTag = e.currentTarget.value)}
			onkeydown={(e) => {
				if (e.key === "Enter") addNew();
			}}
		/>
		<button
			type="button"
			disabled={busy || !newTag || Boolean(newTagError)}
			onclick={addNew}
		>
			добавить в список
		</button>
		{#if newTagError}
			<span class="note bad">{newTagError}</span>
		{/if}
	</div>

	{#if rows.length === 0}
		<p class="empty">Тегов пока нет — добавь их в форме единицы.</p>
	{:else}
		<div class="filter">
			<input
				type="text"
				bind:value={query}
				placeholder="найти тег"
				aria-label="поиск тега"
			/>
			{#if query !== ""}
				<button
					type="button"
					class="clear"
					aria-label="сбросить поиск"
					title="сбросить"
					onclick={() => (query = "")}
				>
					×
				</button>
				<span class="found">
					{visible.length} из {rows.length}
				</span>
			{/if}
		</div>

		{#if visible.length === 0}
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
							{#if !row.listed}
								<span class="tag-note">только в записях</span>
							{/if}
							<span class="where">
								{row.units
									.map((unit) => `${unit.type}/${unit.slug}`)
									.join(", ")}
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
	<div class="scopes">
		<span>убрать «{removing.tag}»:</span>
		<label>
			<input type="radio" bind:group={dropScope} value="list" />
			из списка
		</label>
		{#if removing.count > 0}
			<label>
				<input type="radio" bind:group={dropScope} value="content" />
				из записей ({removing.count})
			</label>
		{/if}
		<label>
			<input type="radio" bind:group={dropScope} value="both" />
			отовсюду
		</label>
	</div>
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
		font-size: 17px;
		font-weight: 600;
	}

	.edit {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
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

	.filter {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-wrap: wrap;
		padding: var(--gap-2) 0;
	}

	.filter input,
	.adder input {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.filter input {
		flex: 1;
		min-width: 160px;
	}

	.filter .clear {
		font: inherit;
		font-size: var(--fs-md);
		padding: 0 8px;
		background: transparent;
		border: none;
		color: var(--text-faint);
		line-height: 1;
		cursor: pointer;
	}

	.filter .clear:hover {
		color: var(--danger);
	}

	.adder input {
		min-width: 180px;
	}

	.filter input:focus,
	.adder input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.adder input[aria-invalid="true"] {
		border-color: var(--danger);
	}

	.found {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.adder {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-wrap: wrap;
	}

	.tag-note {
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.scopes {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: var(--gap-2) var(--gap-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-panel);
		background: var(--surface-2);
		font-size: var(--fs-md);
	}

	.scopes label {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}
</style>
