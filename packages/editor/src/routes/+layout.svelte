<script lang="ts">
	import "../lib/theme.css";
	import { page } from "$app/state";
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const problems = $derived(
		(page.data.problems as { broken: number } | undefined)?.broken ?? 0,
	);
	const onErrors = $derived(page.url.pathname === "/errors");
	const onTags = $derived(page.url.pathname === "/tags");
</script>

<div class="app">
	<header>
		<a class="mark" href="/">редактор</a>
		<nav>
			<a href="/tags" aria-current={onTags || undefined}>теги</a>
			<a href="/errors" aria-current={onErrors || undefined}>
				ошибки
				{#if problems > 0}
					<span class="dot" title="{problems} — не обойти"></span>
				{/if}
			</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		width: 100%;
		min-height: 100vh;
		/* Без боковых полей: интерфейс занимает весь экран от края до края.
		   clip, а не hidden, — иначе ломается position: sticky у колонки с текстом. */
		padding: 0 0 var(--gap-8);
		overflow-x: clip;
		display: flex;
		flex-direction: column;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		height: 56px;
		padding-inline: var(--gutter);
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}

	.mark {
		font-size: 19px;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
		letter-spacing: -0.01em;
	}

	main {
		flex: 1;
		padding-top: var(--gap-6);
	}

	nav {
		margin-left: auto;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: var(--fs-md);
		color: var(--text-dim);
		text-decoration: none;
		padding: 7px 14px;
		border: 1px solid var(--line);
		border-radius: var(--r-control);
		background: var(--surface);
	}

	nav a:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}

	nav a[aria-current] {
		color: var(--text);
		background: var(--surface-2);
		border-color: var(--line-strong);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--danger);
	}
</style>
