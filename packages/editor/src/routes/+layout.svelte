<script lang="ts">
	import "../lib/theme.css";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="app">
	<AppHeader />
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

	main {
		flex: 1;
		padding-top: var(--gap-6);
	}
</style>
