<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import type { ProjectPathReport } from "@ku6epxboctuk/content-core/shared";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const STATE_TEXT: Record<ProjectPathReport["state"], string> = {
		ok: "найдена",
		"not-set": "не задана",
		missing: "папки нет",
		"not-a-repo": "не git-репозиторий",
	};

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
		<button type="button" onclick={() => invalidateAll()}>перепроверить</button>
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
			<h2>не обойти <span class="count">{broken.length}</span></h2>
			<ul>
				{#each broken as report (report.slug)}
					<li>
						<a href="/project/{report.slug}">{report.slug}</a>
						<span class="title">{report.title}</span>
						<span class="state">{STATE_TEXT[report.state]}</span>
						<code>{report.declared}</code>
						{#if report.resolved && report.resolved !== report.declared}
							<code class="resolved">{report.resolved}</code>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if unset.length > 0}
		<section>
			<h2>не участвуют <span class="count">{unset.length}</span></h2>
			<p class="note">
				Папка не указана. Это не поломка: не каждый проект нужен в weekly.
			</p>
			<ul class="plain">
				{#each unset as report (report.slug)}
					<li>
						<a href="/project/{report.slug}">{report.slug}</a>
						<span class="title">{report.title}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if ok.length > 0}
		<details>
			<summary>найдено <span class="count">{ok.length}</span></summary>
			<ul class="plain">
				{#each ok as report (report.slug)}
					<li>
						<a href="/project/{report.slug}">{report.slug}</a>
						<code class="resolved">{report.resolved}</code>
					</li>
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
		letter-spacing: -0.01em;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		margin: 0 0 var(--gap-2);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--danger);
	}

	.lead,
	.note {
		margin: 0;
		font-size: var(--fs-md);
		line-height: 1.6;
		color: var(--text-dim);
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

	.all-good {
		margin: 0;
		padding: var(--gap-3);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		background: var(--accent-wash);
		font-size: var(--fs-md);
		color: var(--accent);
	}

	.count {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0;
		color: var(--text-faint);
		background: var(--surface-2);
		border-radius: 999px;
		padding: 1px 6px;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: 8px var(--gap-3);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
		font-size: var(--fs-md);
	}

	li:last-child {
		border-bottom: none;
	}

	ul.plain li {
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

	.state {
		font-size: var(--fs-sm);
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--danger-wash);
		color: var(--danger);
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
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}

	button {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 12px;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	button:hover {
		color: var(--text);
		background: var(--surface-3);
	}
</style>
