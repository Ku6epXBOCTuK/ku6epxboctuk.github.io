<script lang="ts">
	import type { TagRow } from "$lib/types";
	import Button from "../ui/Button.svelte";

	/*
	 * Строка тега в режиме просмотра: имя (клик — переименовать), счётчик,
	 * где стоит, и кнопка удаления.
	 */

	interface Props {
		row: TagRow;
		busy: boolean;
		onedit: () => void;
		onremove: () => void;
	}

	let { row, busy, onedit, onremove }: Props = $props();
</script>

<button
	type="button"
	class="name"
	disabled={busy}
	onclick={onedit}
	title="переименовать"
>
	{row.tag}
</button>
<span class="count">{row.count}</span>
{#if !row.listed}
	<span class="tag-note">только в записях</span>
{/if}
<span class="where">
	{row.units.map((unit) => `${unit.type}/${unit.slug}`).join(", ")}
</span>
<Button variant="danger" size="sm" disabled={busy} onclick={onremove}>
	убрать
</Button>

<style>
	.name {
		font: inherit;
		font-family: var(--font-mono);
		background: transparent;
		border: none;
		padding: var(--gap-half) 0;
		color: var(--accent);
		min-width: 140px;
		text-align: left;
		cursor: pointer;
	}

	.name:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.count {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-dim);
		min-width: var(--gap-4);
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

	.tag-note {
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}
</style>
