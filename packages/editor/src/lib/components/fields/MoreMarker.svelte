<script lang="ts">
	import Button from "../ui/Button.svelte";

	/*
	 * Полоса `<!--more-->`: обязательный маркер тизера для статей. Показывает,
	 * есть ли маркер и какой длины тизер, и умеет вставлять/убирать его.
	 */

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
		<Button size="xs" {disabled} onclick={onremove}>убрать</Button>
	{:else}
		<span><strong>&lt;!--more--&gt;</strong> · обязателен для статьи</span>
		<Button size="xs" {disabled} onclick={oninsert}>вставить</Button>
	{/if}
</div>

<style>
	.marker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-3);
		font-size: var(--fs-sm);
		padding: var(--pad-field);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		background: var(--accent-wash);
		color: var(--text-dim);
	}

	.marker.missing {
		border-color: var(--line-danger);
		background: var(--danger-wash);
		color: var(--danger);
	}
</style>
