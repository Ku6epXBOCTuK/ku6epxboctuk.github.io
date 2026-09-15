<script lang="ts">
	import PostCard from "$cmp/PostCard.svelte";
	import type { Row } from "$cmp/TerminalWindow.svelte";
	import TerminalWindow from "$cmp/TerminalWindow.svelte";
	import { HOME_RECENT_POSTS, SOCIAL } from "$lib/config";
	import { DEFAULT_LANG, langUrl, type ContentLang } from "$lib/content";
	import { ui } from "$lib/i18n";
	import { getPosts } from "$lib/posts";

	interface Props {
		lang?: ContentLang;
	}

	let { lang = DEFAULT_LANG }: Props = $props();

	const t = $derived(ui(lang));

	const nowRows: Row[] = $derived([
		{ cmd: "whoami", value: t.home.terminal.whoami },
		{ cmd: "current_mood", value: t.home.terminal.mood, tone: "mood" },
		{ cmd: "now_playing", value: t.home.terminal.playing, tone: "status" },
	]);

	const recentPosts = $derived(getPosts(lang).slice(0, HOME_RECENT_POSTS));
</script>

<section class="hero">
	<div class="hero-copy">
		<span class="eyebrow">{t.home.eyebrow}</span>
		<h1>
			{t.home.titleTop}<br /><em>{t.home.titleEm}</em>{t.home.titleMid}<br />{t
				.home.titleBottom}
		</h1>
		<p>{t.home.intro}</p>
		<div class="hero-actions">
			<a class="btn btn-primary" href={langUrl(lang, "/posts")}>
				{t.home.primary}
			</a>
			<a class="btn btn-ghost" href={langUrl(lang, "/projects")}>
				{t.home.ghost}
			</a>
		</div>
		<div class="hero-chips">
			<a class="chip" href={SOCIAL.telegram} target="_blank" rel="noreferrer">
				telegram
			</a>
			<a class="chip" href={SOCIAL.twitch} target="_blank" rel="noreferrer">
				twitch
			</a>
			<a class="chip" href={SOCIAL.discord} target="_blank" rel="noreferrer">
				discord
			</a>
		</div>
	</div>
	<TerminalWindow title="xboct.dev / now" rows={nowRows} />
</section>

{#if recentPosts.length}
	<section class="section">
		<div class="section-head">
			<div>
				<span class="eyebrow">{t.home.sectionEyebrow}</span>
				<h2>{t.home.sectionTitle}</h2>
			</div>
			<a class="text-link" href={langUrl(lang, "/posts")}>
				{t.home.sectionLink}
			</a>
		</div>
		<div class="grid-2">
			{#each recentPosts as post (post.slug)}
				<PostCard {post} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.hero {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 72px;
		align-items: center;
		padding: 100px 0 105px;
	}

	.hero-copy h1 {
		font-family: var(--font-display);
		font-size: clamp(38px, 5vw, 70px);
		line-height: 1.08;
		letter-spacing: -0.065em;
		margin: 20px 0;
	}

	.hero-copy h1 em {
		color: var(--coral);
		font-style: normal;
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--coral);
		text-transform: uppercase;
		letter-spacing: 0.13em;
		font-size: 11px;
		font-weight: 700;
	}

	.hero-copy > p {
		max-width: 510px;
		font-size: 18px;
		color: var(--muted-foreground);
	}

	.section {
		padding: 10px 0 96px;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 20px;
		margin-bottom: 22px;
	}

	.section-head h2 {
		font-family: var(--font-display);
		font-size: 30px;
		letter-spacing: -0.03em;
		margin: 8px 0 0;
		color: var(--foreground);
	}

	.text-link {
		color: var(--coral);
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
	}

	.text-link:hover {
		text-decoration: underline;
	}

	.grid-2 {
		display: grid;
		gap: 18px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.hero-actions {
		display: flex;
		gap: 12px;
		margin-top: 28px;
	}

	.hero-chips {
		display: flex;
		gap: 8px;
		margin-top: 18px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 700;
		padding: 7px 14px;
		border: 2px solid var(--outline);
		border-radius: 8px;
		color: var(--muted-foreground);
		text-decoration: none;
		transition: transform 0.15s ease;
	}

	.chip:hover {
		transform: translateY(-1px);
		color: var(--foreground);
	}

	:global([data-skin="soft"]) .chip {
		border-width: 1px;
		border-radius: 12px;
	}

	.btn {
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
		text-decoration: none;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.btn:hover {
		transform: translateY(-1px);
	}

	.btn-primary {
		border: none;
		background: var(--primary);
		color: var(--primary-foreground);
		box-shadow: var(--hard-shadow);
	}

	.btn-ghost {
		border: 2px solid var(--outline);
	}

	:global([data-skin="soft"]) .btn {
		border-radius: 12px;
	}

	:global([data-skin="soft"]) .btn-primary {
		border: 1px solid transparent;
		background: var(--foreground);
		color: var(--background);
		box-shadow: none;
	}

	:global([data-skin="soft"]) .btn-ghost {
		border: 1px solid var(--line);
	}

	@media (max-width: 700px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 35px;
			padding: 60px 0 70px;
		}

		.hero-copy h1 {
			font-size: 43px;
		}

		.hero-actions {
			flex-direction: column;
			align-items: flex-start;
		}

		.grid-2 {
			grid-template-columns: 1fr;
		}

		.section {
			padding: 10px 0 70px;
		}
	}
</style>
