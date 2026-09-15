<script lang="ts">
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

	let meta = $derived(data.meta);
	let Content = $derived(data.content);
</script>

<article class="writing-post">
	<h1 class="post-title">{meta.title}</h1>
	<div class="post-meta">
		<span class="post-date">{meta.date}</span>
		{#each meta.tags as tag (tag)}
			<span class="post-tag">#{tag}</span>
		{/each}
	</div>
	<div class="post-content">
		<Content />
	</div>
</article>

<style>
	.writing-post {
		max-width: 100%;
	}

	.post-title {
		color: var(--fg);
		font-size: 24px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.post-meta {
		color: var(--dim);
		font-size: 12px;
		margin-bottom: 32px;
	}

	.post-tag {
		color: var(--accent3);
		margin-left: 12px;
	}

	.post-content {
		color: var(--fg);
		line-height: 1.8;
	}

	.post-content :global(h2) {
		color: var(--accent);
		font-size: 18px;
		margin: 32px 0 16px;
	}

	.post-content :global(p) {
		margin-bottom: 16px;
	}

	.post-content :global(ul),
	.post-content :global(ol) {
		margin: 16px 0;
		padding-left: 24px;
	}

	.post-content :global(li) {
		margin: 8px 0;
	}

	.post-content :global(code) {
		background: var(--bg-light);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 13px;
	}

	.post-content :global(pre) {
		background: var(--bg-light);
		padding: 16px;
		border-radius: 4px;
		overflow-x: auto;
		margin: 16px 0;
	}
</style>
