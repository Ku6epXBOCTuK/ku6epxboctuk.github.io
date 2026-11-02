<script lang="ts">
	import type {
		ContentLang,
		ContentType,
		Entry,
	} from "@ku6epxboctuk/content-core/shared";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import SectionTitle from "@ku6epxboctuk/ui-kit/components/SectionTitle";
	import MarkdownField from "../fields/MarkdownField.svelte";

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };

	interface Props {
		entry: Entry | null;
		type: ContentType;
		slug: string;
		busy: boolean;
		status: string;
		onbody: (lang: ContentLang, body: string) => void;
		oncopytext: (from: ContentLang, to: ContentLang) => void;
		onclear: (lang: ContentLang) => void;
		onsave: () => void;
	}

	let {
		entry,
		type,
		slug,
		busy,
		status,
		onbody,
		oncopytext,
		onclear,
		onsave,
	}: Props = $props();

	function canCopy(to: ContentLang): boolean {
		return !entry || entry.versions[to].body.trim() === "";
	}
</script>

{#snippet textColumn(lang: ContentLang, copyTo: ContentLang)}
	<div class="pair-col">
		<div class="pair-head">
			<SectionTitle mono>{LANG_LABEL[lang]}</SectionTitle>
			<div class="pair-tools">
				<Button
					size="sm"
					disabled={!canCopy(copyTo) || busy}
					title={canCopy(copyTo)
						? `скопировать текст ${LANG_LABEL[lang]} в ${LANG_LABEL[copyTo]}`
						: `${LANG_LABEL[copyTo]} не пуст — копирование затрёт текст`}
					onclick={() => oncopytext(lang, copyTo)}
					>{LANG_LABEL[lang]} → {LANG_LABEL[copyTo]}</Button
				>
				<Button
					variant="danger"
					size="sm"
					disabled={busy}
					onclick={() => onclear(lang)}>очистить</Button
				>
			</div>
		</div>
		<MarkdownField
			value={entry?.versions[lang].body ?? ""}
			disabled={busy}
			{slug}
			needsMoreMarker={type === "article"}
			onchange={(body) => onbody(lang, body)}
		/>
	</div>
{/snippet}

<section class="texts">
	<div class="texts-pair">
		{@render textColumn("ru", "en")}
		{@render textColumn("en", "ru")}
	</div>

	<div class="save-row">
		<Button variant="primary" disabled={busy} onclick={onsave}>сохранить</Button
		>
		{#if status}<span class="status">{status}</span>{/if}
	</div>
</section>

<style>
	.texts {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-4);
		padding: var(--ui-space-5);
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-panel);
		background: var(--ui-surface);
	}

	.texts-pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--ui-space-6);
		align-items: start;
	}

	.pair-col {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-4);
		min-width: 0;
	}

	.pair-head {
		display: flex;
		align-items: center;
		padding-bottom: var(--ui-space-4);
		border-bottom: 1px solid var(--ui-line-strong);
	}

	.pair-tools {
		display: flex;
		gap: var(--ui-space-3);
		margin-left: auto;
	}

	.save-row {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		padding-top: var(--ui-space-3);
		flex-wrap: wrap;
	}

	.status {
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-secondary);
	}

	@media (width <= 1100px) {
		.texts-pair {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--ui-space-5);
		}
	}
</style>
