<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import ArticleCard from "$cmp/ArticleCard.svelte";
	import PostCard from "$cmp/PostCard.svelte";
	import ProjectCard from "$cmp/ProjectCard.svelte";
	import SectionTitle from "$cmp/SectionTitle.svelte";
	import { langUrl, pageLang, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";
	import { tagIndex, type TaggedEntry } from "$lib/tags";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = "ru" as ContentLang }: Props = $props();

	const active = $derived(pageLang(page.data.lang ?? lang));
	const t = $derived(ui(active));

	const index = $derived(tagIndex(active));

	// NOTE: the selected tag lives in the URL so a filtered page can be shared;
	// there is no SSR, so it is read in the browser.
	const selected = $derived(page.url.searchParams.get("tag") ?? "");

	const shown = $derived(index.find((entry) => entry.tag === selected));

	const visible = $derived<TaggedEntry[]>(
		selected ? (shown?.items ?? []) : index.flatMap((entry) => entry.items),
	);

	function select(tag: string) {
		goto(
			tag
				? `${langUrl(active, "/tags")}?tag=${encodeURIComponent(tag)}`
				: langUrl(active, "/tags"),
			{
				replaceState: true,
				noScroll: true,
			},
		);
	}
</script>

<div class="tags">
	<SectionTitle style="margin-bottom:0">{t.nav.tags}</SectionTitle>

	<div class="cloud">
		<button
			type="button"
			class="chip"
			class:on={selected === ""}
			onclick={() => select("")}
		>
			{t.tags.all}
			<span class="num">{visible.length}</span>
		</button>
		{#each index as entry (entry.tag)}
			<button
				type="button"
				class="chip"
				class:on={selected === entry.tag}
				onclick={() => select(entry.tag)}
			>
				#{entry.tag}
				<span class="num">{entry.count}</span>
			</button>
		{/each}
	</div>

	{#if index.length === 0}
		<p class="empty">{t.tags.empty}</p>
	{:else if selected && !shown}
		<p class="empty">
			{t.tags.unknown}
			<strong>{selected}</strong>
			<a class="reset" href={langUrl(active, "/tags")}>{t.tags.all}</a>
		</p>
	{:else}
		<div class="list">
			{#each visible as entry (entry.key)}
				{#if entry.type === "article"}
					<ArticleCard article={entry.article} />
				{:else if entry.type === "project"}
					<ProjectCard project={entry.project} />
				{:else}
					<PostCard post={entry.post} />
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.tags {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.cloud {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font: inherit;
		font-size: 12px;
		padding: 4px 10px;
		color: var(--muted-foreground);
		background: transparent;
		border: 1px solid var(--outline);
		border-radius: 999px;
		cursor: pointer;
		transition:
			color 120ms,
			border-color 120ms,
			background 120ms;
	}

	.chip:hover {
		color: var(--foreground);
		border-color: var(--coral);
	}

	.chip:focus-visible {
		outline: 2px solid var(--coral);
		outline-offset: 2px;
	}

	.chip.on {
		color: var(--background);
		background: var(--coral);
		border-color: var(--coral);
	}

	.num {
		font-size: 10px;
		color: var(--muted-foreground);
	}

	.chip.on .num {
		color: inherit;
		opacity: 0.75;
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 12px;
		align-items: start;
	}

	.empty {
		color: var(--muted-foreground);
		font-size: 13px;
	}

	.empty strong {
		color: var(--foreground);
	}

	.reset {
		margin-left: 10px;
		color: var(--coral);
	}
</style>
