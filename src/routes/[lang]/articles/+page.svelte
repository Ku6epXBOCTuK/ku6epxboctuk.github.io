<script lang="ts">
	import ArticlesPage from "$cmp/ArticlesPage.svelte";
	import type { ContentLang } from "$lib/content";

	interface Props {
		data: {
			lang: ContentLang;
		};
	}

	let { data }: Props = $props();
</script>

<ArticlesPage lang={data.lang} />
