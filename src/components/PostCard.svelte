<script lang="ts">
	import Card from "$cmp/Card.svelte";
	import type { Post } from "$lib/posts";

	interface Props {
		post: Post;
	}

	let { post }: Props = $props();
</script>

<Card href="/posts/{post.slug}" draft={post.draft}>
	<div class="post-card">
		<div class="post-header">
			<span class="post-title">{post.title}</span>
			<span class="post-date">{post.date}</span>
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
		gap: 8px;
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
		font-weight: 600;
		font-size: 14px;
	}

	.post-title:hover {
		color: var(--coral);
	}

	.post-date {
		color: var(--muted-foreground);
		font-size: 12px;
		white-space: nowrap;
	}

	.post-tags {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 11px;
		color: var(--sky);
	}

	.post-link {
		font-size: 11px;
		color: var(--periwinkle);
		margin-top: 2px;
	}
</style>
