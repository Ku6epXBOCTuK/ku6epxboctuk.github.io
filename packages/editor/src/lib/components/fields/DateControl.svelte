<script lang="ts">
	interface Props {
		id: string;
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, disabled = false, onchange }: Props = $props();
</script>

<input
	{id}
	type="date"
	{disabled}
	{value}
	oninput={(e) => onchange(e.currentTarget.value)}
/>

<style>
	input {
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--pad-field);
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	input:disabled {
		background: var(--surface);
		color: var(--text-faint);
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
	}

	input:hover:not(:disabled):not(:focus) {
		border-color: var(--line-hover);
	}
</style>
