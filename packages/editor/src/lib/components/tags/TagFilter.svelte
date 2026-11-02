<script lang="ts">
	import IconButton from "@ku6epxboctuk/ui-kit/components/IconButton";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

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
		oninput={(e) => oninput(e.currentTarget.value)}
	/>
	{#if value !== ""}
		<IconButton
			size="sm"
			label="сбросить поиск"
			title="сбросить"
			onclick={() => oninput("")}
		>
			×
		</IconButton>
		<span class="found">
			{found} из {total}
		</span>
	{/if}
</div>

<style>
	.filter {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		flex-wrap: wrap;
		padding: var(--ui-space-3) 0;
	}

	.filter :global(input) {
		flex: 1;
		min-width: 160px;
	}

	.found {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
	}
</style>
