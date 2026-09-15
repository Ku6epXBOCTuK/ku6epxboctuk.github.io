<script lang="ts">
	import { page } from "$app/state";
	import Card from "$cmp/Card.svelte";
	import { langUrl, pageLang } from "$lib/content";
	import type { Project } from "$lib/projects";

	interface Props {
		project: Project;
	}

	let { project }: Props = $props();

	const href = $derived(
		langUrl(pageLang(page.data.lang), `/projects/${project.slug}`),
	);

	const repoShort = $derived(
		project.repo?.replace("https://github.com/", "") ?? "",
	);
</script>

<Card {href} draft={project.draft}>
	<div class="project-card">
		{#if project.image}
			<div class="project-screenshot">
				<img src={project.image} alt={project.title} />
			</div>
		{/if}
		<div class="project-info">
			<div class="project-name">
				{project.title}
				{#if project.repo}
					<span class="project-repo">{repoShort}</span>
				{/if}
			</div>
			{#if project.subtitle}
				<div class="project-subtitle">{project.subtitle}</div>
			{/if}
			{#if project.description}
				<div class="project-desc">{project.description}</div>
			{/if}
			<div class="project-tags">
				{#each project.tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		</div>
	</div>
</Card>

<style>
	.project-card {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.project-screenshot {
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
		background: var(--background);
	}

	.project-screenshot::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.04) 2px,
			rgba(0, 0, 0, 0.04) 4px
		);
		pointer-events: none;
		z-index: 2;
	}

	.project-screenshot img {
		width: 100%;
		display: block;
		filter: brightness(0.9) contrast(1.05);
		transition: filter 0.3s ease;
	}

	.project-screenshot:hover img {
		filter: brightness(1) contrast(1);
	}

	.project-name {
		color: var(--coral);
		font-weight: 700;
		font-size: 15px;
	}

	.project-repo {
		color: var(--muted-foreground);
		font-weight: 400;
		font-size: 12px;
		margin-left: 8px;
	}

	.project-subtitle {
		color: var(--muted-foreground);
		font-size: 12px;
	}

	.project-desc {
		color: var(--foreground);
		font-size: 13px;
		line-height: 1.6;
	}

	.project-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 11px;
		padding: 2px 8px;
		border: 1px solid var(--outline);
		border-radius: 4px;
		color: var(--muted-foreground);
	}
</style>
