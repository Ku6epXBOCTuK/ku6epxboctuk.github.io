<script lang="ts">
	interface Props {
		id: string;
		value: string;
		disabled?: boolean;
		rows?: number;
		onchange: (value: string) => void;
	}

	let { id, value, disabled = false, rows = 3, onchange }: Props = $props();
</script>

<textarea
	{id}
	{disabled}
	{rows}
	{value}
	oninput={(e) => onchange(e.currentTarget.value)}
></textarea>

<style>
	textarea {
		font: inherit;
		font-size: var(--ui-fs-lg);
		line-height: var(--ui-lh);
		padding: var(--pad-field);
		color: var(--ui-fg);
		background: var(--ui-bg);
		border: 1px solid var(--ui-line-strong);
		border-radius: var(--ui-r-control);
		resize: vertical;
	}

	textarea::placeholder {
		color: var(--ui-fg-muted);
	}

	textarea:disabled {
		background: var(--ui-surface);
		color: var(--ui-fg-muted);
	}

	textarea:focus {
		outline: none;
		border-color: var(--ui-accent-ink);
	}

	textarea:hover:not(:disabled):not(:focus) {
		border-color: var(--ui-line-strong);
	}
</style>
