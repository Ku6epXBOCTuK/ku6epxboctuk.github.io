<script lang="ts">
	import Button from "@ku6epxboctuk/ui-kit/components/Button.svelte";

	interface Props {
		hasMarker: boolean;
		teaserLength: number;
		disabled?: boolean;
		oninsert: () => void;
		onremove: () => void;
	}

	let {
		hasMarker,
		teaserLength,
		disabled = false,
		oninsert,
		onremove,
	}: Props = $props();
</script>

<div class="marker" class:missing={!hasMarker}>
	{#if hasMarker}
		<span>
			<strong>&lt;!--more--&gt;</strong> · тизер {teaserLength}
		</span>
		<Button size="sm" {disabled} onclick={onremove}>убрать</Button>
	{:else}
		<span><strong>&lt;!--more--&gt;</strong> · обязателен для статьи</span>
		<Button size="sm" {disabled} onclick={oninsert}>вставить</Button>
	{/if}
</div>

<style>
	.marker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ui-space-4);
		font-size: var(--ui-fs-md);
		padding: var(--pad-field);
		border: 1px solid var(--ui-accent);
		border-radius: var(--ui-r-control);
		background: var(--ui-accent-surface);
		color: var(--ui-fg-secondary);
	}

	.marker.missing {
		border-color: color-mix(in srgb, var(--ui-danger) 50%, var(--ui-line));
		background: var(--ui-danger-surface);
		color: var(--ui-danger);
	}
</style>
