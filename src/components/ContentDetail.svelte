<script lang="ts">
	import type { Component } from "svelte";

	interface DetailMeta {
		title: string;
		date: string;
		tags: string[];
	}

	interface Props {
		meta: DetailMeta;
		content: Component;
	}

	let { meta, content: Content }: Props = $props();
</script>

<article class="content-detail">
	<h1 class="detail-title">{meta.title}</h1>
	<div class="detail-meta">
		<span class="detail-date">{meta.date}</span>
		{#each meta.tags as tag (tag)}
			<span class="detail-tag">#{tag}</span>
		{/each}
	</div>
	<div class="detail-body">
		<Content />
	</div>
</article>

<style>
	.content-detail {
		max-width: 100%;
	}

	.detail-title {
		color: var(--foreground);
		font-size: 24px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.detail-meta {
		color: var(--muted-foreground);
		font-size: 12px;
		margin-bottom: 32px;
	}

	.detail-tag {
		color: var(--sky);
		margin-left: 12px;
	}

	.detail-body {
		color: var(--foreground);
		line-height: 1.8;
	}

	.detail-body :global(h2) {
		color: var(--coral);
		font-size: 18px;
		margin: 32px 0 16px;
	}

	.detail-body :global(p) {
		margin-bottom: 16px;
	}

	.detail-body :global(ul),
	.detail-body :global(ol) {
		margin: 16px 0;
		padding-left: 24px;
	}

	.detail-body :global(li) {
		margin: 8px 0;
	}

	.detail-body :global(code) {
		background: var(--window);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 13px;
	}

	.detail-body :global(pre) {
		background: var(--window);
		padding: 16px;
		border-radius: 4px;
		overflow-x: auto;
		margin: 16px 0;
	}
</style>
