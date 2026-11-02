<script lang="ts">
	import type {
		ContentLang,
		FieldDef,
	} from "@ku6epxboctuk/content-core/shared";
	import type { FieldRow } from "$lib/groups";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import SectionTitle from "@ku6epxboctuk/ui-kit/components/SectionTitle";
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
		<SectionTitle mono>{LANG_LABEL.ru}</SectionTitle>
		<span class="pair-head-gap"></span>
		<SectionTitle mono class="pair-head-en">{LANG_LABEL.en}</SectionTitle>
	</div>

	{#each rows as row, index (index)}
		{#if row.title}
			<SectionTitle tone="accent" size="sm" class="row-head"
				>{row.title}</SectionTitle
			>
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
		<Notice variant="box" tone="accent" class="gh-status">{ghStatus}</Notice>
	{/if}
</div>

<style>
	.pair {
		/* NOTE: arrow column is fixed-width: auto collapses to zero and EN drifts left of its fields. */
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--ui-space-4);
		row-gap: 0;
		align-items: start;
	}

	:global(.row-head) {
		grid-column: 1 / -1;
		margin: var(--ui-space-5) 0 var(--ui-space-3);
	}

	:global(.row-head:first-of-type) {
		margin-top: 0;
	}

	.cell {
		min-width: 0;
		padding: var(--cell-py) 0;
		border-bottom: 1px solid var(--ui-line);
	}

	.pair-head {
		grid-column: 1 / -1;
		display: grid;
		/* NOTE: same tracks as .pair, so the labels sit above their fields. */
		grid-template-columns: minmax(0, 1fr) var(--arrow-w) minmax(0, 1fr);
		column-gap: var(--ui-space-4);
		align-items: center;
		padding-bottom: var(--ui-space-4);
		border-bottom: 1px solid var(--ui-line-strong);
	}

	:global(.pair-head-en) {
		grid-column: 3;
	}

	.pair-head-gap {
		grid-column: 2;
	}

	:global(.gh-status) {
		grid-column: 1 / -1;
		margin: var(--ui-space-4) 0 0;
	}

	@media (width <= 1100px) {
		.pair {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--ui-space-5);
		}

		:global(.row-head),
		.pair-head {
			grid-column: 1;
		}

		:global(.pair-head-en) {
			grid-column: 1;
		}
	}
</style>
