<script lang="ts">
	import { getWeeklyReports } from "$lib/weekly";
	import ReportCard from "$cmp/ReportCard.svelte";
	import SectionTitle from "$cmp/SectionTitle.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));
	const reports = $derived(getWeeklyReports(lang));
</script>

<SectionTitle>{t.nav.weekly}</SectionTitle>

<div class="list">
	{#each reports as report (report.slug)}
		<ReportCard {report} />
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
