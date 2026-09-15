<script lang="ts">
	import ContentDetail from "$cmp/ContentDetail.svelte";
	import type { Component } from "svelte";

	interface Version {
		meta: {
			title: string;
			date: string;
			tags: string[];
		};
		content: Component;
	}

	interface Props {
		data: {
			meta: Version["meta"];
			content: Component;
			alt: Version;
		};
	}

	let { data }: Props = $props();
</script>

{#key data}
	<ContentDetail meta={data.meta} content={data.content} alt={data.alt} />
{/key}
