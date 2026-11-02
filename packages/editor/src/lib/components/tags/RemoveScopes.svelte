<script lang="ts">
	import type { TagDropScope, TagRow } from "$lib/types";

	interface Props {
		row: TagRow;
		value: TagDropScope;
		onchange: (next: TagDropScope) => void;
	}

	let { row, value, onchange }: Props = $props();
</script>

<div class="scopes">
	<span>убрать «{row.tag}»:</span>
	<label>
		<input
			type="radio"
			name="drop-scope"
			checked={value === "list"}
			onchange={() => onchange("list")}
		/>
		из списка
	</label>
	{#if row.count > 0}
		<label>
			<input
				type="radio"
				name="drop-scope"
				checked={value === "content"}
				onchange={() => onchange("content")}
			/>
			из записей ({row.count})
		</label>
	{/if}
	<label>
		<input
			type="radio"
			name="drop-scope"
			checked={value === "both"}
			onchange={() => onchange("both")}
		/>
		отовсюду
	</label>
</div>

<style>
	.scopes {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		flex-wrap: wrap;
		padding: var(--ui-space-3) var(--ui-space-4);
		border: 1px solid var(--ui-line-strong);
		border-radius: var(--ui-r-panel);
		background: var(--ui-panel);
		font-size: var(--ui-fs-lg);
	}

	.scopes label {
		display: inline-flex;
		align-items: center;
		gap: var(--ui-space-1);
		cursor: pointer;
	}
</style>
