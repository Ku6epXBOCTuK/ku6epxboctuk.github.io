<script lang="ts">
	import { getPosts } from "$lib/posts";

	const posts = getPosts();
</script>

<div class="section-title">posts</div>

{#each posts as post (post.slug)}
	<a href="/posts/{post.urlSlug}" class="content-item">
		<div class="item-header">
			<span class="item-title">{post.title}</span>
			<span class="item-date">{post.date}</span>
		</div>
		<div class="item-tags">
			{#each post.tags as tag (tag)}
				#{tag}
			{/each}
		</div>
	</a>
{/each}

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

	.content-item {
		display: block;
		margin: 24px 0;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--outline);
		text-decoration: none;
	}

	.content-item:last-child {
		border-bottom: none;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.item-title {
		color: var(--foreground);
		font-weight: 500;
		font-size: 14px;
	}

	.item-title:hover {
		color: var(--coral);
	}

	.item-date {
		color: var(--muted-foreground);
		font-size: 12px;
		white-space: nowrap;
	}

	.item-tags {
		color: var(--sky);
		font-size: 11px;
		margin-top: 8px;
	}
</style>
