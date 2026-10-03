<script lang="ts">
	interface Props {
		id: string;
		value: string | number;
		disabled?: boolean;
		onchange: (value: number | undefined) => void;
	}

	let { id, value, disabled = false, onchange }: Props = $props();
</script>

<input
	{id}
	type="number"
	{disabled}
	{value}
	oninput={(e) =>
		onchange(
			e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value),
		)}
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
