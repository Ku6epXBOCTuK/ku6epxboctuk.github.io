<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ReportRow from "$lib/components/errors/ReportRow.svelte";
	import Badge from "$lib/components/ui/Badge.svelte";
	import Button from "$lib/components/ui/Button.svelte";
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
			<h2>не обойти <Badge pill>{broken.length}</Badge></h2>
			<ul>
				{#each broken as report (report.slug)}
					<ReportRow {report} />
				{/each}
			</ul>
		</section>
	{/if}

	{#if unset.length > 0}
		<section>
			<h2>не участвуют <Badge pill>{unset.length}</Badge></h2>
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
			<summary>найдено <Badge pill>{ok.length}</Badge></summary>
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
		gap: var(--gap-6);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
	}

	h1 {
		flex: 1;
		margin: 0;
		font-size: var(--fs-xl);
		font-weight: 600;
		letter-spacing: var(--track-tight);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		margin: 0 0 var(--gap-2);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--danger);
	}

	.lead,
	.note {
		margin: 0;
		font-size: var(--fs-md);
		line-height: var(--lh-copy);
		color: var(--text-dim);
	}

	.lead code {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	.all-good {
		margin: 0;
		padding: var(--gap-3);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		background: var(--accent-wash);
		font-size: var(--fs-md);
		color: var(--accent);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	ul.plain {
		border: none;
	}

	details {
		border-top: 1px solid var(--line);
		padding-top: var(--gap-4);
	}

	summary {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		margin-bottom: var(--gap-3);
		cursor: pointer;
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--text-faint);
	}
</style>
