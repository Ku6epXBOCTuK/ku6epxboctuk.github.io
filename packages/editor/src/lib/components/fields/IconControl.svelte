<script lang="ts">
	/*
	 * Пикер глифа: сетка квадратов с самими символами. Кнопка, а не select,
	 * потому что выбирается картинка, а не название картинки. Глифы
	 * показываются теми же символами, какие попадут в текст: иначе приходится
	 * запоминать, как `⬡` выглядит в коде.
	 */

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
		gap: var(--gap-05);
		max-width: var(--icon-grid-w);
	}

	.glyph {
		font: inherit;
		font-size: var(--fs-label);
		line-height: 1;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		color: var(--text-dim);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
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
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.glyph:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--accent);
	}

	.glyph.on {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
	}

	.glyph.clear {
		color: var(--text-faint);
	}
</style>
