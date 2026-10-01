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
		Weekly обходит проекты по папке <code>path</code> из frontmatter. Если папка недоступна,
		проект в отчёт не попадёт.
	</p>

	{#if broken.length === 0 && unset.length === 0}
		<p class="all-good">
			Всё на месте: у каждого проекта заданная папка найдена.
		</p>
	{/if}

	{#if broken.length > 0}
		<section>
			<h2>Нельзя обойти · {broken.length}</h2>
			<ul>
				{#each broken as report (report.slug)}
					<li>
						<a href="/project/{report.slug}">{report.slug}</a>
						<span class="title">{report.title}</span>
						<span class="state" data-state={report.state}
							>{STATE_TEXT[report.state]}</span
						>
						<code class="declared">{report.declared}</code>
						{#if report.resolved}
							<code class="resolved">{report.resolved}</code>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if unset.length > 0}
		<section>
			<h2>Не участвуют · {unset.length}</h2>
			<p class="note">
				Папка не указана. Это не поломка: не каждый проект нужен в weekly.
			</p>
			<ul>
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
			<summary>Найдено · {ok.length}</summary>
			<ul>
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
		gap: 18px;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	h1 {
		flex: 1;
		margin: 0;
		font-size: 17px;
	}

	h2 {
		margin: 0 0 8px;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #7a2020;
	}

	.lead,
	.note {
		margin: 0;
		font-size: 13px;
		color: #555;
	}

	.all-good {
		margin: 0;
		padding: 12px;
		border: 1px solid #c8ddc8;
		border-radius: 6px;
		background: #f4faf4;
		font-size: 13px;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
		padding: 8px 10px;
		border: 1px solid #e0c0c0;
		border-radius: 5px;
		font-size: 13px;
	}

	.title {
		color: #666;
	}

	.state {
		font-size: 12px;
		padding: 1px 7px;
		border-radius: 10px;
		background: #fdf0f0;
		color: #a11;
	}

	code {
		font-size: 12px;
		color: #444;
	}

	.resolved {
		color: #777;
	}

	details {
		border-top: 1px solid #eee;
		padding-top: 12px;
	}

	summary {
		cursor: pointer;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #555;
	}

	details li {
		border-color: #ddd;
	}

	button {
		font: inherit;
		font-size: 13px;
		padding: 6px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		background: #fff;
		cursor: pointer;
	}
</style>
