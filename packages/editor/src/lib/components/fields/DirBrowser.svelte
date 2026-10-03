<script lang="ts">
	import type { DirEntry } from "@ku6epxboctuk/content-core";
	import Button from "../ui/Button.svelte";

	interface Props {
		path: string;
		parent: string | null;
		dirs: DirEntry[];
		roots: string[];
		loading: boolean;
		error: string;
		current: string;
		disabled?: boolean;
		onnavigate: (path: string) => void;
		onchoose: (path: string) => void;
	}

	let {
		path,
		parent,
		dirs,
		roots,
		loading,
		error,
		current,
		disabled = false,
		onnavigate,
		onchoose,
	}: Props = $props();
</script>

<div class="panel">
	{#if roots.length > 0}
		<div class="roots">
			{#each roots as root (root)}
				<Button size="sm" {disabled} onclick={() => onnavigate(root)}>
					{root}
				</Button>
			{/each}
		</div>
	{/if}

	<div class="bar">
		<Button
			size="sm"
			disabled={disabled || !parent}
			onclick={() => onnavigate(parent ?? path)}
		>
			↑ вверх
		</Button>
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
						onclick={() => onnavigate(entry.full)}
					>
						<span class="mark" class:repo={entry.isRepo} aria-hidden="true"
							>{entry.isRepo ? "◆" : "◇"}</span
						>
						{entry.name}
					</button>
					<Button
						size="sm"
						{disabled}
						title="выбрать эту папку"
						onclick={() => onchoose(entry.full)}
					>
						выбрать
					</Button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="bar">
		<Button
			variant="primary"
			size="sm"
			disabled={disabled || !path}
			onclick={() => onchoose(current || path)}
		>
			выбрать текущую папку
		</Button>
		{#if current && current !== path}
			<Button size="sm" {disabled} onclick={() => onchoose(current)}>
				оставить введённое
			</Button>
		{/if}
	</div>
</div>

<style>
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

	.roots :global(.btn) {
		font-family: var(--font-mono);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: var(--dirs-max-h);
		overflow-y: auto;
		border: 1px solid var(--line);
		border-radius: var(--r-control);
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--gap-1);
		padding: var(--gap-half) var(--gap-05);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	.open {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		font: inherit;
		font-size: var(--fs-sm);
		padding: var(--pad-btn-sm);
		text-align: left;
		color: var(--text-dim);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.open:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.open:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}

	.mark {
		font-size: var(--mark-size);
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
