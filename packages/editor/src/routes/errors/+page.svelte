<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ReportRow from "$lib/components/errors/ReportRow.svelte";
	import Badge from "@ku6epxboctuk/ui-kit/components/Badge";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import SectionTitle from "@ku6epxboctuk/ui-kit/components/SectionTitle";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const broken = $derived(
		data.reports.filter(
			(report) => report.state === "missing" || report.state === "not-a-repo",
		),
	);
	const unset = $derived(
		data.reports.filter((report) => report.state === "not-set"),
	);
	const ok = $derived(data.reports.filter((report) => report.state === "ok"));
</script>

<div class="errors">
	<header>
		<h1>Ошибки</h1>
		<Button onclick={() => invalidateAll()}>перепроверить</Button>
	</header>

	<p class="lead">
		Weekly обходит проекты по папке <code>path</code> из frontmatter. Нет папки —
		проект в отчёт не попадёт.
	</p>

	{#if data.reports.length === 0}
		<Notice variant="box" tone="accent" size="lg"
			>Проектов пока нет — проверять нечего.</Notice
		>
	{:else if broken.length === 0 && unset.length === 0}
		<Notice variant="box" tone="accent" size="lg"
			>Всё на месте: у каждого проекта папка найдена.</Notice
		>
	{/if}

	{#if broken.length > 0}
		<section>
			<SectionTitle tone="danger" class="errors-title"
				>не обойти <Badge>{broken.length}</Badge></SectionTitle
			>
			<ul>
				{#each broken as report (report.slug)}
					<ReportRow {report} />
				{/each}
			</ul>
		</section>
	{/if}

	{#if unset.length > 0}
		<section>
			<SectionTitle tone="danger" class="errors-title"
				>не участвуют <Badge>{unset.length}</Badge></SectionTitle
			>
			<Notice size="lg"
				>Папка не указана. Это не поломка: не каждый проект нужен в weekly.</Notice
			>
			<ul class="plain">
				{#each unset as report (report.slug)}
					<ReportRow {report} plain />
				{/each}
			</ul>
		</section>
	{/if}

	{#if ok.length > 0}
		<details>
			<summary>найдено <Badge>{ok.length}</Badge></summary>
			<ul class="plain">
				{#each ok as report (report.slug)}
					<ReportRow {report} plain />
				{/each}
			</ul>
		</details>
	{/if}
</div>

<style>
	.errors {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-6);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
	}

	h1 {
		flex: 1;
		margin: 0;
		font-size: var(--ui-fs-xl);
		font-weight: 600;
		letter-spacing: var(--track-tight);
	}

	:global(.errors-title) {
		margin: 0 0 var(--ui-space-3);
	}

	.lead {
		margin: 0;
		font-size: var(--ui-fs-lg);
		line-height: var(--ui-lh);
		color: var(--ui-fg-secondary);
	}

	.lead code {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-panel);
		overflow: hidden;
	}

	ul.plain {
		border: none;
	}

	details {
		border-top: 1px solid var(--ui-line);
		padding-top: var(--ui-space-5);
	}

	summary {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		margin-bottom: var(--ui-space-4);
		cursor: pointer;
		font-size: var(--ui-fs-md);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-fg-muted);
	}
</style>
