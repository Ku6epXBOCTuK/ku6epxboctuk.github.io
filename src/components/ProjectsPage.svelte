<script lang="ts">
	import { getProjects } from "$lib/projects";
	import ProjectCard from "$cmp/ProjectCard.svelte";
	import SectionTitle from "$cmp/SectionTitle.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));
	const projects = $derived(getProjects(lang));
</script>

<SectionTitle>{t.nav.projects}</SectionTitle>

<div class="list">
	{#each projects as project (project.slug)}
		<ProjectCard {project} />
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
