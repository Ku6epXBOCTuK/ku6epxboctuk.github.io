<script lang="ts">
	import { getArticles } from "$lib/articles";
	import ArticleCard from "$cmp/ArticleCard.svelte";

	const articles = getArticles();
</script>

<div class="section-title">articles</div>

<div class="list">
	{#each articles as article (article.slug)}
		<ArticleCard {article} />
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
