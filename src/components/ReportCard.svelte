<script lang="ts">
	import { page } from "$app/state";
	import Card from "$cmp/Card.svelte";
	import { langUrl, pageLang } from "$lib/content";
	import type { WeeklyReport } from "$lib/weekly";

	interface Props {
		report: WeeklyReport;
	}

	let { report }: Props = $props();

	const href = $derived(
		langUrl(pageLang(page.data.lang), `/weekly/${report.slug}`),
	);
</script>

<Card {href} draft={report.draft}>
	<div class="report-card">
		<div class="report-header">
			<span class="report-title">{report.title}</span>
			<span class="report-date">{report.date}</span>
		</div>
		{#if report.excerpt}
			<div class="report-excerpt">{report.excerpt}</div>
		{/if}
	</div>
</Card>

<style>
	.report-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}

	.report-title {
		color: var(--foreground);
		font-weight: 600;
		font-size: 14px;
	}

	.report-title:hover {
		color: var(--coral);
	}

	.report-date {
		color: var(--muted-foreground);
		font-size: 12px;
		white-space: nowrap;
	}

	.report-excerpt {
		color: var(--muted-foreground);
		font-size: 12px;
		line-height: 1.6;
	}
</style>
