<script lang="ts">
	import PostsPage from "$cmp/PostsPage.svelte";
	import type { ContentLang } from "$lib/content";

	interface Props {
		data: {
			lang: ContentLang;
		};
	}

	let { data }: Props = $props();
</script>

<PostsPage lang={data.lang} />
