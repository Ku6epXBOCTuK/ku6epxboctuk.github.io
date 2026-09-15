<script lang="ts">
	import { getWeeklyReports } from "$lib/weekly";

	const reports = getWeeklyReports();
</script>

<div class="section-title">weekly</div>

{#each reports as report (report.slug)}
	<a href="/weekly/{report.slug}" class="content-item">
		<div class="item-header">
			<span class="item-title">{report.title}</span>
			<span class="item-date">{report.date}</span>
		</div>
		{#if report.excerpt}
			<div class="item-excerpt">{report.excerpt}</div>
		{/if}
	</a>
{/each}

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

	.content-item {
		display: block;
		margin: 24px 0;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--outline);
		text-decoration: none;
	}

	.content-item:last-child {
		border-bottom: none;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.item-title {
		color: var(--foreground);
		font-weight: 500;
		font-size: 14px;
	}

	.item-title:hover {
		color: var(--coral);
	}

	.item-date {
		color: var(--muted-foreground);
		font-size: 12px;
		white-space: nowrap;
	}

	.item-excerpt {
		color: var(--muted-foreground);
		font-size: 12px;
		margin-top: 8px;
		line-height: 1.6;
	}
</style>
