<script lang="ts">
	import type { TagRow } from "$lib/types";
	import Button from "@ku6epxboctuk/ui-kit/components/Button.svelte";

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
		font-family: var(--ui-font-mono);
		background: transparent;
		border: none;
		padding: var(--gap-half) 0;
		color: var(--ui-accent-ink);
		min-width: 140px;
		text-align: left;
		cursor: pointer;
	}

	.name:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.count {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-secondary);
		min-width: var(--ui-space-5);
	}

	.where {
		flex: 1;
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.tag-note {
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
	}
</style>
