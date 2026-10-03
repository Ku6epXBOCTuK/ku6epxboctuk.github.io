<script lang="ts">
	interface Props {
		id: string;
		value: string;
		choices: readonly string[];
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, choices, disabled = false, onchange }: Props = $props();
</script>

<select
	{id}
	{disabled}
	{value}
	onchange={(e) => onchange(e.currentTarget.value)}
>
	<option value="">—</option>
	{#each choices as choice (choice)}
		<option value={choice}>{choice}</option>
	{/each}
</select>

<style>
	select {
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--pad-field);
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	select:disabled {
		background: var(--surface);
		color: var(--text-faint);
	}

	select:focus {
		outline: none;
		border-color: var(--accent);
	}

	select:hover:not(:disabled):not(:focus) {
		border-color: var(--line-hover);
	}
</style>
