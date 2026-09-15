<script lang="ts">
	import { page } from "$app/state";
	import { otherLang, pageLang } from "$lib/content";
	import { ui } from "$lib/i18n";
	import type { Component } from "svelte";

	interface DetailMeta {
		title: string;
		date: string;
		tags: string[];
	}

	interface Props {
		meta: DetailMeta;
		content: Component;
		alt: { meta: DetailMeta; content: Component };
	}

	let { meta, content: Content, alt }: Props = $props();

	const lang = $derived(pageLang(page.data.lang));
	const altLang = $derived(otherLang(lang));

	let showAlt = $state(false);

	const shown = $derived(showAlt ? alt : { meta, content: Content });
	const Shown = $derived(shown.content);
	const label = $derived(ui(showAlt ? lang : altLang).readIn);
</script>

<article class="content-detail">
	<div class="detail-head">
		<h1 class="detail-title">{shown.meta.title}</h1>
		<button class="detail-toggle" onclick={() => (showAlt = !showAlt)}>
			{label}
		</button>
	</div>
	<div class="detail-meta">
		<span class="detail-date">{shown.meta.date}</span>
		{#each shown.meta.tags as tag (tag)}
			<span class="detail-tag">#{tag}</span>
		{/each}
	</div>
	<div class="detail-body">
		<Shown />
	</div>
</article>

<style>
	.content-detail {
		max-width: 100%;
	}

	.detail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}

	.detail-title {
		color: var(--foreground);
		font-size: 24px;
		font-weight: 600;
		margin: 0;
	}

	.detail-toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-display);
		font-size: 13px;
		font-weight: 700;
		padding: 12px 17px;
		border-radius: 10px;
		border: 2px solid var(--outline);
		background: var(--window);
		color: var(--foreground);
		cursor: pointer;
		white-space: nowrap;
		transition: transform 0.15s ease;
	}

	.detail-toggle:hover {
		transform: translateY(-1px);
	}

	:global([data-skin="soft"]) .detail-toggle {
		border-radius: 12px;
		border-width: 1px;
	}

	.detail-meta {
		color: var(--muted-foreground);
		font-size: 12px;
		margin-bottom: 32px;
	}

	.detail-tag {
		color: var(--sky);
		margin-left: 12px;
	}

	.detail-body {
		color: var(--foreground);
		line-height: 1.8;
	}

	.detail-body :global(h2) {
		color: var(--coral);
		font-size: 18px;
		margin: 32px 0 16px;
	}

	.detail-body :global(p) {
		margin-bottom: 16px;
	}

	.detail-body :global(ul),
	.detail-body :global(ol) {
		margin: 16px 0;
		padding-left: 24px;
	}

	.detail-body :global(li) {
		margin: 8px 0;
	}

	.detail-body :global(code) {
		background: var(--window);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 13px;
	}

	.detail-body :global(pre) {
		background: var(--window);
		padding: 16px;
		border-radius: 4px;
		overflow-x: auto;
		margin: 16px 0;
	}
</style>
