<script lang="ts">
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

	code {
		font-size: 12px;
	}
</style>
