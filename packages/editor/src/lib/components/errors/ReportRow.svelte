<script lang="ts">
	import type { ProjectPathReport } from "@ku6epxboctuk/content-core/shared";
	import Badge from "@ku6epxboctuk/ui-kit/components/Badge";

	const STATE_TEXT: Record<ProjectPathReport["state"], string> = {
		ok: "найдена",
		"not-set": "не задана",
		missing: "папки нет",
		"not-a-repo": "не git-репозиторий",
	};

	interface Props {
		report: ProjectPathReport;
		plain?: boolean;
	}

	let { report, plain = false }: Props = $props();
</script>

<li class:plain>
	<a href="/project/{report.slug}">{report.slug}</a>
	{#if plain}
		{#if report.resolved}
			<code class="resolved">{report.resolved}</code>
		{:else}
			<span class="title">{report.title}</span>
		{/if}
	{:else}
		<span class="title">{report.title}</span>
		<Badge tone="danger">{STATE_TEXT[report.state]}</Badge>
		<code>{report.declared}</code>
		{#if report.resolved && report.resolved !== report.declared}
			<code class="resolved">{report.resolved}</code>
		{/if}
	{/if}
</li>

<style>
	li {
		display: flex;
		align-items: baseline;
		gap: var(--ui-space-4);
		flex-wrap: wrap;
		padding: var(--pad-row);
		border-bottom: 1px solid var(--ui-line);
		background: var(--ui-surface);
		font-size: var(--ui-fs-lg);
	}

	li:last-child {
		border-bottom: none;
	}

	li.plain {
		border: none;
	}

	a {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg);
		text-decoration: none;
	}

	a:hover {
		color: var(--ui-accent-ink);
	}

	.title {
		color: var(--ui-fg-muted);
	}

	code {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-secondary);
	}

	.resolved {
		color: var(--ui-fg-muted);
		word-break: break-all;
	}
</style>
