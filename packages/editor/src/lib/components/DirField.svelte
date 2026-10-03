<script lang="ts">
	import type { DirEntry } from "@ku6epxboctuk/content-core";

	/*
	 * Обзор папок для поля «Локальная папка».
	 *
	 * Системного диалога нет и быть не может: `showDirectoryPicker` отдаёт
	 * handle без пути, веб не должен знать расположение файлов на диске. Путь
	 * знает только Node, поэтому список приходит с сервера вместе с готовыми
	 * путями, а форма ничего не склеивает — иначе разделители пришлось бы
	 * угадывать.
	 */

	interface Listing {
		path: string;
		parent: string | null;
		dirs: DirEntry[];
		roots: string[];
	}

	interface Props {
		id?: string;
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id = "", value, disabled = false, onchange }: Props = $props();

	let open = $state(false);
	let path = $state("");
	let parent = $state<string | null>(null);
	let dirs = $state<DirEntry[]>([]);
	let roots = $state<string[]>([]);
	let loading = $state(false);
	let error = $state("");

	const current = $derived(value.trim());

	async function load(next?: string) {
		loading = true;
		error = "";
		try {
			const res = await fetch(
				next ? `/api/dirs?path=${encodeURIComponent(next)}` : "/api/dirs",
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as Listing;
			path = data.path;
			parent = data.parent;
			dirs = data.dirs;
			roots = data.roots;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
		}
	}

	async function toggle() {
		open = !open;
		if (open) await load(current || undefined);
	}

	function choose(target: string) {
		onchange(target);
		open = false;
	}
</script>

<div class="dir-field">
	<div class="row">
		<input
			{id}
			type="text"
			class="mono"
			{disabled}
			{value}
			placeholder="C:\projects\example-repo"
			oninput={(e) => onchange(e.currentTarget.value)}
		/>
		<button type="button" {disabled} onclick={toggle}>
			{open ? "закрыть" : "обзор"}
		</button>
	</div>

	{#if open}
		<div class="panel">
			{#if roots.length > 0}
				<div class="roots">
					{#each roots as root (root)}
						<button type="button" {disabled} onclick={() => load(root)}>
							{root}
						</button>
					{/each}
				</div>
			{/if}

			<div class="bar">
				<button
					type="button"
					disabled={disabled || !parent}
					onclick={() => load(parent ?? path)}
				>
					↑ вверх
				</button>
				<span class="where" title={path}>{path}</span>
			</div>

			{#if loading}
				<p class="hint">читаю…</p>
			{:else if error}
				<p class="hint bad">{error}</p>
			{:else if dirs.length === 0}
				<p class="hint">здесь нет подпапок</p>
			{:else}
				<ul>
					{#each dirs as entry (entry.full)}
						<li>
							<button
								type="button"
								class="open"
								{disabled}
								onclick={() => load(entry.full)}
							>
								<span class="mark" class:repo={entry.isRepo} aria-hidden="true"
									>{entry.isRepo ? "◆" : "◇"}</span
								>
								{entry.name}
							</button>
							<button
								type="button"
								{disabled}
								onclick={() => choose(entry.full)}
								title="выбрать эту папку"
							>
								выбрать
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="bar">
				<button
					type="button"
					class="primary"
					disabled={disabled || !path}
					onclick={() => choose(current || path)}
				>
					выбрать текущую папку
				</button>
				{#if current && current !== path}
					<button type="button" {disabled} onclick={() => choose(current)}>
						оставить введённое
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/*
	 * Стили кнопок здесь свои: scoped-правила `Field.svelte` до внутренностей
	 * дочернего компонента не достают, а без них кнопка рисуется браузером —
	 * светло-серая с чёрным текстом, то есть нечитаемо на тёмной теме.
	 *
	 * Порядок — по возрастанию специфичности, иначе stylelint ругается.
	 */
	.dir-field {
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
	}

	.dir-field button {
		font: inherit;
		font-size: var(--fs-sm);
		padding: 5px 10px;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
		transition:
			color 100ms,
			background 100ms,
			border-color 100ms;
	}

	.dir-field button.primary {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
		font-weight: 600;
	}

	.dir-field button.open {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		text-align: left;
		background: transparent;
		border: 1px solid transparent;
	}

	.roots button {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		padding: 3px 7px;
	}

	.dir-field button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.dir-field button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.dir-field button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
		border-color: var(--accent-dim);
	}

	.dir-field input {
		font: inherit;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		padding: 7px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	.dir-field input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.row {
		display: flex;
		gap: var(--gap-2);
		align-items: center;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
		padding: var(--gap-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		background: var(--surface);
	}

	.bar {
		display: flex;
		gap: var(--gap-2);
		align-items: center;
		flex-wrap: wrap;
	}

	.where {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-faint);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.roots {
		display: flex;
		gap: var(--gap-1);
		flex-wrap: wrap;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 260px;
		overflow-y: auto;
		border: 1px solid var(--line);
		border-radius: var(--r-control);
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--gap-1);
		padding: 2px 4px;
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	.mark {
		/* Один и тот же знак, заполненный и пустой: квадратик со стрелочкой
		   читались по-разному — стрелка мельче и терялась на его фоне. */
		font-size: 12px;
		color: var(--text-faint);
	}

	.mark.repo {
		color: var(--accent);
	}

	.hint {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.hint.bad {
		color: var(--danger);
	}
</style>
