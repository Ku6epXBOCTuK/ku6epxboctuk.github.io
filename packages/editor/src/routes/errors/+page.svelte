<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ReportRow from "$lib/components/errors/ReportRow.svelte";
	import Badge from "@ku6epxboctuk/ui-kit/components/Badge";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
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
		<p class="all-good">Проектов пока нет — проверять нечего.</p>
	{:else if broken.length === 0 && unset.length === 0}
		<p class="all-good">Всё на месте: у каждого проекта папка найдена.</p>
	{/if}

	{#if broken.length > 0}
		<section>
			<h2>не обойти <Badge>{broken.length}</Badge></h2>
			<ul>
				{#each broken as report (report.slug)}
					<ReportRow {report} />
				{/each}
			</ul>
		</section>
	{/if}

	{#if unset.length > 0}
		<section>
			<h2>не участвуют <Badge>{unset.length}</Badge></h2>
			<p class="note">
				Папка не указана. Это не поломка: не каждый проект нужен в weekly.
			</p>
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

	h2 {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		margin: 0 0 var(--ui-space-3);
		font-size: var(--ui-fs-md);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-danger);
	}

	.lead,
	.note {
		margin: 0;
		font-size: var(--ui-fs-lg);
		line-height: var(--ui-lh);
		color: var(--ui-fg-secondary);
	}

	.lead code {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
	}

	.all-good {
		margin: 0;
		padding: var(--ui-space-4);
		border: 1px solid var(--ui-accent);
		border-radius: var(--ui-r-control);
		background: var(--ui-accent-surface);
		font-size: var(--ui-fs-lg);
		color: var(--ui-accent-ink);
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
