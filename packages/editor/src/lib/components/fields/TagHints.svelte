<script lang="ts">
	import Popover from "@ku6epxboctuk/ui-kit/components/Popover";

	interface Props {
		anchor: HTMLElement | null;
		suggestions: string[];
		needle: string;
		disabled?: boolean;
		width?: number;
		onpick: (tag: string) => void;
		onclose: () => void;
	}

	let {
		anchor,
		suggestions,
		needle,
		disabled = false,
		width = undefined,
		onpick,
		onclose,
	}: Props = $props();

	const NO_MATCH = -1;
</script>

<Popover
	open
	{anchor}
	placement="start"
	minWidth={width === undefined ? undefined : `${width}px`}
	role="listbox"
	label="подсказки тегов"
	class="hints"
	{onclose}
>
	{#each suggestions as tag (tag)}
		{@const at = needle === "" ? NO_MATCH : tag.indexOf(needle)}
		<button
			type="button"
			role="option"
			class="hint"
			aria-selected="false"
			{disabled}
			onmousedown={(e) => {
				// NOTE: preventDefault keeps focus in the input, otherwise blur closes the list before the click lands.
				e.preventDefault();
				onpick(tag);
			}}
		>
			{#if at >= 0}
				{tag.slice(0, at)}<mark>{tag.slice(at, at + needle.length)}</mark
				>{tag.slice(at + needle.length)}
			{:else}
				{tag}
			{/if}
		</button>
	{/each}
</Popover>

<style>
	:global(.hints) {
		max-height: var(--hints-max-h);
	}

	.hint {
		display: block;
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--pad-btn-sm);
		color: var(--text-dim);
		background: transparent;
		border: none;
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.hint mark {
		color: var(--accent);
		background: transparent;
	}

	.hint:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}
</style>
