<script lang="ts">
	import type { FieldRow } from "$lib/groups";
	import Field from "../fields/Field.svelte";

	interface FieldAction {
		label: string;
		run: () => void;
	}

	interface Props {
		title: string;
		rows: FieldRow[];
		scope: "shared" | "local";
		busy: boolean;
		slug: string;
		value: (name: string) => unknown;
		onchange: (name: string, next: unknown) => void;
		actionFor?: (name: string) => FieldAction | undefined;
	}

	let { title, rows, scope, busy, slug, value, onchange, actionFor }: Props =
		$props();
</script>

<section class="panel">
	<div class="head">
		<h2>{title}</h2>
	</div>
	<div class="body">
		{#each rows as row, index (index)}
			{#if row.title}
				<h3 class="group">{row.title}</h3>
			{:else if row.shared}
				{@const action = actionFor?.(row.shared.name)}
				<Field
					field={row.shared}
					{scope}
					value={value(row.shared.name)}
					disabled={busy}
					{slug}
					actionLabel={action?.label}
					onaction={action?.run}
					onchange={(next) => onchange(row.shared?.name ?? "", next)}
				/>
			{/if}
		{/each}
	</div>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-4);
		padding: var(--ui-space-5);
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-panel);
		background: var(--ui-surface);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		padding-bottom: var(--ui-space-3);
		border-bottom: 1px solid var(--ui-line);
	}

	.head h2 {
		margin: 0;
		font-size: var(--ui-fs-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-accent-ink);
	}

	.body {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: var(--ui-space-6);
		align-items: start;
	}

	.group {
		grid-column: 1 / -1;
		margin: var(--ui-space-4) 0 0;
		font-size: var(--ui-fs-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-fg-muted);
	}

	.group:first-child {
		margin-top: 0;
	}

	@media (width <= 1100px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--ui-space-5);
		}
	}
</style>
