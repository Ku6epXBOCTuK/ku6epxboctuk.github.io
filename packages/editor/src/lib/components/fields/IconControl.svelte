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

<div class="icon-grid" role="radiogroup" aria-labelledby={id}>
	{#each choices as glyph (glyph)}
		<button
			type="button"
			class="glyph"
			class:on={value === glyph}
			role="radio"
			aria-checked={value === glyph}
			aria-label={`иконка ${glyph}`}
			{disabled}
			onclick={() => onchange(glyph)}
		>
			{glyph}
		</button>
	{/each}
	<button
		type="button"
		class="glyph clear"
		class:on={value === ""}
		role="radio"
		aria-checked={value === ""}
		aria-label="без иконки"
		{disabled}
		onclick={() => onchange("")}
	>
		—
	</button>
</div>

<style>
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--icon-cell), 1fr));
		gap: var(--ui-space-1);
		max-width: var(--icon-grid-w);
	}

	.glyph {
		font: inherit;
		font-size: var(--ui-fs-md);
		line-height: 1;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		color: var(--ui-fg-secondary);
		background: var(--ui-bg);
		border: 1px solid var(--ui-line-strong);
		border-radius: var(--ui-r-control);
		cursor: pointer;
		transition:
			color 100ms,
			border-color 100ms,
			background 100ms;
	}

	.glyph:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.glyph:focus-visible {
		outline: 2px solid var(--ui-accent-ink);
		outline-offset: 1px;
	}

	.glyph:hover:not(:disabled) {
		color: var(--ui-fg);
		border-color: var(--ui-accent-ink);
	}

	.glyph.on {
		color: var(--ui-bg);
		background: var(--ui-accent-ink);
		border-color: var(--ui-accent-ink);
	}

	.glyph.clear {
		color: var(--ui-fg-muted);
	}
</style>
