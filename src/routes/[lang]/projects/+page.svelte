<script lang="ts">
	import ProjectsPage from "$cmp/ProjectsPage.svelte";
	import type { ContentLang } from "$lib/content";

	interface Props {
		data: {
			lang: ContentLang;
		};
	}

	let { data }: Props = $props();
</script>

<ProjectsPage lang={data.lang} />
