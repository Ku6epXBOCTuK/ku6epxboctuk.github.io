<script lang="ts">
	import { getPosts } from "$lib/posts";
	import PostCard from "$cmp/PostCard.svelte";

	const posts = getPosts();
</script>

<div class="section-title">posts</div>

<div class="list">
	{#each posts as post (post.slug)}
		<PostCard {post} />
	{/each}
</div>

<style>
	.section-title {
		color: var(--coral);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 24px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--outline);
	}

	.section-title::before {
		content: "# ";
		color: var(--muted-foreground);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
