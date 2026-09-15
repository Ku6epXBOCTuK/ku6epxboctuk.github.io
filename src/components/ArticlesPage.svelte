<script lang="ts">
	import { getArticles } from "$lib/articles";
	import ArticleCard from "$cmp/ArticleCard.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));
	const articles = $derived(getArticles(lang));
</script>

<div class="section-title">{t.nav.articles}</div>

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
