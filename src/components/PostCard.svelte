<script lang="ts">
	import { page } from "$app/state";
	import Card from "$cmp/Card.svelte";
	import ThemeImage from "$cmp/ThemeImage.svelte";
	import { langUrl, pageLang } from "$lib/content";
	import type { Post } from "$lib/posts";

	interface Props {
		post: Post;
	}

	let { post }: Props = $props();

	const href = $derived(
		langUrl(pageLang(page.data.lang), `/posts/${post.slug}`),
	);
</script>

<Card {href} draft={post.draft}>
	<div class="post-card">
		{#if post.image}
			<div class="post-banner">
				<ThemeImage src={post.image} alt={post.title} />
			</div>
		{/if}
		<div class="post-header">
			<span class="post-title">{post.title}</span>
			<span class="post-date">{post.date}</span>
		</div>
		<div class="post-body">
			<post.module.default />
		</div>
		{#if post.tags.length}
			<div class="post-tags">
				{#each post.tags as tag (tag)}
					<span class="tag">#{tag}</span>
				{/each}
			</div>
		{/if}
		{#if post.link}
			<span class="post-link">{post.link}</span>
		{/if}
	</div>
</Card>

<style>
	.post-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.post-banner {
		margin: -8px -12px 4px;
		border-radius: 8px;
		overflow: hidden;
	}

	.post-banner :global(.theme-image) {
		aspect-ratio: 1200 / 630;
	}

	.post-banner :global(.theme-image img) {
		height: 100%;
		object-fit: cover;
	}

	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}

	.post-title {
		color: var(--foreground);
		font-weight: 700;
		font-size: 19px;
	}

	.post-title:hover {
		color: var(--coral);
	}

	.post-date {
		color: var(--muted-foreground);
		font-size: 15px;
		white-space: nowrap;
	}

	.post-body {
		color: var(--muted-foreground);
		font-size: 15px;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-body :global(p) {
		margin: 0;
	}

	/* Карточка сама ссылка: вложенные ссылки недоступны и не должны кликаться. */
	.post-body :global(a) {
		color: inherit;
		text-decoration: none;
		pointer-events: none;
	}

	.post-tags {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 15px;
		color: var(--sky);
	}

	.post-link {
		font-size: 15px;
		color: var(--periwinkle);
		margin-top: 2px;
	}
</style>
