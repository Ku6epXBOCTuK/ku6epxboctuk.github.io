<script lang="ts">
	import { getProjects } from "$lib/projects";
	import ProjectCard from "$cmp/ProjectCard.svelte";

	let projects = getProjects();
</script>

<div class="section-title">projects</div>

<div class="list">
	{#each projects as project (project.slug)}
		<ProjectCard {project} />
	{/each}
</div>

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

	.list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
