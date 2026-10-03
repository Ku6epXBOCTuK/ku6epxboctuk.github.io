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
		font-size: var(--fs-md);
		line-height: var(--lh-field);
		padding: var(--pad-field);
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		resize: vertical;
	}

	textarea::placeholder {
		color: var(--text-faint);
	}

	textarea:disabled {
		background: var(--surface);
		color: var(--text-faint);
	}

	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	textarea:hover:not(:disabled):not(:focus) {
		border-color: var(--line-hover);
	}
</style>
