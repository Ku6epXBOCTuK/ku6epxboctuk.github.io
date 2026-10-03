<script lang="ts">
	interface Props {
		tag: string;
		copied?: boolean;
		dragging?: boolean;
		disabled?: boolean;
		oncopy: (tag: string) => void;
		onremove: (tag: string) => void;
		ondragstart: (event: DragEvent) => void;
		ondrop: (event: DragEvent) => void;
		ondragend: () => void;
	}

	let {
		tag,
		copied = false,
		dragging = false,
		disabled = false,
		oncopy,
		onremove,
		ondragstart,
		ondrop,
		ondragend,
	}: Props = $props();
</script>

<li
	class:dragging
	draggable={disabled ? "false" : "true"}
	{ondragstart}
	ondragover={(e) => e.preventDefault()}
	{ondrop}
	{ondragend}
>
	<button
		type="button"
		class="tag"
		title="копировать"
		{disabled}
		onclick={() => oncopy(tag)}
	>
		{copied ? "скопировано" : tag}
	</button>
	<button
		type="button"
		class="x"
		aria-label="убрать тег {tag}"
		{disabled}
		onclick={() => onremove(tag)}
	>
		×
	</button>
</li>

<style>
	li {
		display: inline-flex;
		align-items: center;
		font-size: var(--fs-sm);
		background: var(--accent-wash);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
	}

	li.dragging {
		opacity: 0.4;
	}

	button {
		font: inherit;
		font-size: var(--fs-sm);
		background: transparent;
		border: none;
		line-height: 1;
		cursor: pointer;
	}

	.tag {
		padding: var(--gap-half) 0 var(--gap-half) var(--gap-2);
		color: var(--text);
	}

	.x {
		padding: var(--gap-half) var(--gap-05);
		color: var(--text-dim);
	}

	.x:hover:not(:disabled) {
		color: var(--danger);
	}
</style>
