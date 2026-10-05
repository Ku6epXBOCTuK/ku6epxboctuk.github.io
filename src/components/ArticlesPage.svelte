<script lang="ts">
	import { getArticles } from "$lib/articles";
	import ArticleCard from "$cmp/ArticleCard.svelte";
	import SectionTitle from "$cmp/SectionTitle.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));
	const articles = $derived(getArticles(lang));
</script>

<SectionTitle>{t.nav.articles}</SectionTitle>

<div class="list">
	{#each articles as article (article.slug)}
		<ArticleCard {article} />
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
