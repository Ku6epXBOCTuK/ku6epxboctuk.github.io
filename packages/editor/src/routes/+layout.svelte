<script lang="ts">
	import { page } from "$app/state";
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="app">
	<header>
		<span class="mark">редактор</span>
		<span class="hint">локально · пишет в <code>src/content</code></span>
		<nav>
			<a
				href="/errors"
				aria-current={page.url.pathname === "/errors" || undefined}>ошибки</a
			>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		max-width: 960px;
		margin: 0 auto;
		padding: 24px 20px 64px;
	}

	header {
		display: flex;
		align-items: baseline;
		gap: 12px;
		padding-bottom: 12px;
		margin-bottom: 24px;
		border-bottom: 1px solid #ddd;
	}

	.mark {
		font-weight: 700;
	}

	.hint {
		font-size: 13px;
		color: #666;
	}

	header nav {
		margin-left: auto;
	}

	header nav a {
		font-size: 13px;
		color: #333;
		text-decoration: none;
		border: 1px solid #ddd;
		border-radius: 5px;
		padding: 4px 10px;
	}

	header nav a[aria-current] {
		background: #f0f0f0;
		border-color: #bbb;
		font-weight: 600;
	}

	code {
		font-size: 12px;
	}
</style>
