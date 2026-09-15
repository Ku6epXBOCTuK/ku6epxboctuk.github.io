<script lang="ts">
	import ContentDetail from "$cmp/ContentDetail.svelte";
	import type { Component } from "svelte";

	interface Props {
		data: {
			meta: {
				title: string;
				date: string;
				tags: string[];
			};
			content: Component;
		};
	}

	let { data }: Props = $props();
</script>

<ContentDetail meta={data.meta} content={data.content} />
