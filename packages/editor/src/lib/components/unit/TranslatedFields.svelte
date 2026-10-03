<script lang="ts">
	import type {
		ContentLang,
		FieldDef,
	} from "@ku6epxboctuk/content-core/shared";
	import type { FieldRow } from "$lib/groups";
	import Field from "../fields/Field.svelte";
	import CopyArrows from "./CopyArrows.svelte";

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };

	interface Props {
		rows: FieldRow[];
		busy: boolean;
		slug: string;
		ghStatus?: string;
		value: (name: string, lang: ContentLang) => unknown;
		onchange: (name: string, lang: ContentLang, next: unknown) => void;
		fieldLabel: (name: string) => string;
		oncopyfield: (name: string, from: ContentLang, to: ContentLang) => void;
	}

	let {
		rows,
		busy,
		slug,
		ghStatus = "",
		value,
		onchange,
		fieldLabel,
		oncopyfield,
	}: Props = $props();
</script>

{#snippet fieldCell(field: FieldDef | undefined, lang: ContentLang)}
	<div class="cell">
		{#if field}
			<Field
				{field}
				scope={lang}
				value={value(field.name, lang)}
				disabled={busy}
				{slug}
				onchange={(next) => onchange(field.name, lang, next)}
			/>
		{/if}
	</div>
{/snippet}

<div class="pair">
	<div class="pair-head">
		<h2>{LANG_LABEL.ru}</h2>
		<span class="pair-head-gap"></span>
		<h2 class="pair-head-en">{LANG_LABEL.en}</h2>
	</div>

	{#each rows as row, index (index)}
		{#if row.title}
			<h2 class="row-head">{row.title}</h2>
		{:else if row.ru && row.en}
			{@render fieldCell(row.ru, "ru")}
			<div class="arrows-cell">
				<CopyArrows
					label={fieldLabel(row.ru.name)}
					disabled={busy}
					oncopy={(from, to) => oncopyfield(row.ru?.name ?? "", from, to)}
				/>
			</div>
			{@render fieldCell(row.en, "en")}
		{:else}
			{@render fieldCell(row.ru ?? row.en, "ru")}
			<div class="arrows-cell">
				<CopyArrows
					label={fieldLabel((row.ru ?? row.en)?.name ?? "")}
					disabled={busy}
					oncopy={(from, to) =>
						oncopyfield((row.ru ?? row.en)?.name ?? "", from, to)}
				/>
			</div>
			{@render fieldCell(undefined, "en")}
		{/if}
	{/each}

	{#if ghStatus}
		<p class="gh-status">{ghStatus}</p>
	{/if}
</div>

<style>
	.pair {
		/* Третья колонка — стрелки: ширина задана явно, иначе `auto` схлопывается
		   в ноль и EN уезжает левее своих полей. */
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--gap-3);
		row-gap: 0;
		align-items: start;
	}

	.row-head {
		grid-column: 1 / -1;
		margin: var(--gap-4) 0 var(--gap-2);
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--track-wide);
		color: var(--accent);
	}

	.row-head:first-of-type {
		margin-top: 0;
	}

	.cell {
		min-width: 0;
		padding: var(--cell-py) 0;
		border-bottom: 1px solid var(--line);
	}

	.pair-head {
		grid-column: 1 / -1;
		display: grid;
		/* Те же треки, что у формы: метки стоят ровно над своими полями. */
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--gap-3);
		align-items: center;
		padding-bottom: var(--gap-3);
		border-bottom: 1px solid var(--line-strong);
	}

	.pair-head h2 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 700;
		letter-spacing: var(--track-wide);
		color: var(--text-faint);
	}

	.pair-head-en {
		grid-column: 3;
	}

	.pair-head-gap {
		grid-column: 2;
	}

	.gh-status {
		grid-column: 1 / -1;
		margin: var(--gap-3) 0 0;
		padding: var(--gap-2) var(--gap-2);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		background: var(--accent-wash);
		font-size: var(--fs-sm);
		line-height: var(--lh-copy);
		color: var(--text-dim);
	}

	@media (width <= 1100px) {
		.pair {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--gap-4);
		}

		.row-head,
		.pair-head {
			grid-column: 1;
		}

		.pair-head-en {
			grid-column: 1;
		}
	}
</style>
