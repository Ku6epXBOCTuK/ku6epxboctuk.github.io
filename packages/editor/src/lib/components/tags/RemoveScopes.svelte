<script lang="ts">
	import type { TagDropScope, TagRow } from "$lib/types";

	/*
	 * Выбор, откуда убирать тег. Убрать тег из списка и стереть его из
	 * пятидесяти постов — разные вещи, поэтому перед модалкой спрашиваем
	 * явно.
	 */

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
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: var(--gap-2) var(--gap-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-panel);
		background: var(--surface-2);
		font-size: var(--fs-md);
	}

	.scopes label {
		display: inline-flex;
		align-items: center;
		gap: var(--gap-05);
		cursor: pointer;
	}
</style>
