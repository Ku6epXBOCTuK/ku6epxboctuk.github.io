<script lang="ts">
	import { page } from "$app/state";
	import Card from "$cmp/Card.svelte";
	import ThemeImage from "$cmp/ThemeImage.svelte";
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
			<div class="project-thumb">
				<ThemeImage src={project.image} alt={project.title} />
			</div>
		{/if}
		<div class="project-info">
			<div class="project-name">
				{#if project.icon}<span class="project-icon">{project.icon}</span>{/if}
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
		gap: 20px;
		align-items: stretch;
	}

	.project-thumb {
		flex: 0 0 480px;
		border-radius: 8px;
		overflow: hidden;
	}

	.project-thumb :global(.theme-image),
	.project-thumb :global(.theme-image img) {
		height: 100%;
		object-fit: cover;
	}

	.project-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.project-name {
		color: var(--coral);
		font-weight: 700;
		font-size: 19px;
	}

	.project-icon {
		margin-right: 6px;
	}

	.project-repo {
		color: var(--muted-foreground);
		font-weight: 400;
		font-size: 15px;
		margin-left: 8px;
	}

	.project-subtitle {
		color: var(--muted-foreground);
		font-size: 15px;
	}

	.project-desc {
		color: var(--foreground);
		font-size: 16px;
		line-height: 1.6;
	}

	.project-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: auto;
	}

	.tag {
		font-size: 14px;
		padding: 3px 10px;
		border: 1px solid var(--outline);
		border-radius: 4px;
		color: var(--muted-foreground);
	}

	@media (max-width: 560px) {
		.project-card {
			flex-direction: column;
		}

		.project-thumb {
			flex: none;
		}
	}
</style>
