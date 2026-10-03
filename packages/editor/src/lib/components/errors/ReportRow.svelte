<script lang="ts">
	import type { ProjectPathReport } from "@ku6epxboctuk/content-core/shared";
	import Badge from "../ui/Badge.svelte";

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
		<Badge tone="danger" pill>{STATE_TEXT[report.state]}</Badge>
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
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: var(--pad-row);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
		font-size: var(--fs-md);
	}

	li:last-child {
		border-bottom: none;
	}

	li.plain {
		border: none;
	}

	a {
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		color: var(--text);
		text-decoration: none;
	}

	a:hover {
		color: var(--accent);
	}

	.title {
		color: var(--text-faint);
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		color: var(--text-dim);
	}

	.resolved {
		color: var(--text-faint);
		word-break: break-all;
	}
</style>
