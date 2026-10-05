<script lang="ts">
	import { getPosts } from "$lib/posts";
	import PostCard from "$cmp/PostCard.svelte";
	import SectionTitle from "$cmp/SectionTitle.svelte";
	import { DEFAULT_LANG, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));
	const posts = $derived(getPosts(lang));
</script>

<SectionTitle>{t.nav.posts}</SectionTitle>

<div class="list">
	{#each posts as post (post.slug)}
		<PostCard {post} />
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
