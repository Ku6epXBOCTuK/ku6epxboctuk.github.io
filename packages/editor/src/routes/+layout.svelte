<script lang="ts">
	import "@ku6epxboctuk/ui-kit/tokens.css";
	import "@fontsource/ibm-plex-sans/400.css";
	import "@fontsource/ibm-plex-sans/600.css";
	import "@fontsource/ibm-plex-sans/700.css";
	import "@fontsource/ibm-plex-mono/400.css";
	import "../lib/theme.css";
	import "../lib/compat.css";
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
		/* NOTE: overflow-x must stay clip: hidden creates a scroll container and breaks the sticky header. */
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
