<script lang="ts">
	import { page } from "$app/state";
	import Card from "$cmp/Card.svelte";
	import type { Article } from "$lib/articles";
	import { langUrl, pageLang } from "$lib/content";

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();

	const href = $derived(
		langUrl(pageLang(page.data.lang), `/articles/${article.slug}`),
	);
</script>

<Card {href} draft={article.draft}>
	<div class="article-card">
		<div class="article-header">
			<span class="article-title">{article.title}</span>
			<span class="article-date">{article.date}</span>
		</div>
		{#if article.tags.length}
			<div class="article-tags">
				{#each article.tags as tag (tag)}
					<span class="tag">#{tag}</span>
				{/each}
			</div>
		{/if}
		{#if article.langs.length > 1}
			<div class="article-langs">
				{#each article.langs as lang (lang)}
					<span class="lang-badge">{lang}</span>
				{/each}
			</div>
		{/if}
	</div>
</Card>

<style>
	.article-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.article-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}

	.article-title {
		color: var(--foreground);
		font-weight: 600;
		font-size: 14px;
	}

	.article-title:hover {
		color: var(--coral);
	}

	.article-date {
		color: var(--muted-foreground);
		font-size: 12px;
		white-space: nowrap;
	}

	.article-tags {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 11px;
		color: var(--sky);
	}

	.article-langs {
		display: flex;
		gap: 6px;
		margin-top: 2px;
	}

	.lang-badge {
		font-size: 10px;
		padding: 1px 6px;
		border: 1px solid var(--line);
		border-radius: 4px;
		color: var(--muted-foreground);
		text-transform: uppercase;
		font-weight: 700;
	}
</style>
