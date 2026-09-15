<script lang="ts">
	import { getWeeklyReports } from "$lib/weekly";
	import ReportCard from "$cmp/ReportCard.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const reports = $derived(getWeeklyReports(lang));
</script>

<div class="section-title">weekly</div>

<div class="list">
	{#each reports as report (report.slug)}
		<ReportCard {report} />
	{/each}
</div>

<style>
	.section-title {
		color: var(--coral);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 24px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--outline);
	}

	.section-title::before {
		content: "# ";
		color: var(--muted-foreground);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
