<script lang="ts">
	import WeeklyPage from "$cmp/WeeklyPage.svelte";
	import type { ContentLang } from "$lib/content";

	interface Props {
		data: {
			lang: ContentLang;
		};
	}

	let { data }: Props = $props();
</script>

<WeeklyPage lang={data.lang} />
