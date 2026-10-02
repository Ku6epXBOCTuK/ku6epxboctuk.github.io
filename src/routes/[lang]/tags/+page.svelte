<script lang="ts">
	import TagsPage from "$cmp/TagsPage.svelte";
	import type { ContentLang } from "$lib/content";

	interface Props {
		data: {
			lang: ContentLang;
		};
	}

	let { data }: Props = $props();
</script>

<TagsPage lang={data.lang} />
