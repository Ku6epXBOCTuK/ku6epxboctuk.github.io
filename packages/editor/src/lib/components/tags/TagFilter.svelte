<script lang="ts">
	import TextInput from "../ui/TextInput.svelte";

	interface Props {
		value: string;
		found: number;
		total: number;
		oninput: (next: string) => void;
	}

	let { value, found, total, oninput }: Props = $props();
</script>

<div class="filter">
	<TextInput
		{value}
		placeholder="найти тег"
		aria-label="поиск тега"
		{oninput}
	/>
	{#if value !== ""}
		<button
			type="button"
			class="clear"
			aria-label="сбросить поиск"
			title="сбросить"
			onclick={() => oninput("")}
		>
			×
		</button>
		<span class="found">
			{found} из {total}
		</span>
	{/if}
</div>

<style>
	.filter {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-wrap: wrap;
		padding: var(--gap-2) 0;
	}

	.filter :global(input) {
		flex: 1;
		min-width: 160px;
	}

	.clear {
		font: inherit;
		font-size: var(--fs-md);
		padding: 0 var(--gap-2);
		background: transparent;
		border: none;
		color: var(--text-faint);
		line-height: 1;
		cursor: pointer;
	}

	.clear:hover {
		color: var(--danger);
	}

	.found {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}
</style>
