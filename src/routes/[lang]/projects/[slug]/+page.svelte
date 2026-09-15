<script lang="ts">
	import ProjectDetail from "$cmp/ProjectDetail.svelte";
	import type { Project } from "$lib/projects";

	interface Props {
		data: {
			meta: Project;
			alt: Project;
		};
	}

	let { data }: Props = $props();
</script>

{#key data}
	<ProjectDetail meta={data.meta} alt={data.alt} />
{/key}
