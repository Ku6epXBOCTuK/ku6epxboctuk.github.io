<script lang="ts">
	import "../app.css";
	import TerminalHeader from "$cmp/TerminalHeader.svelte";
	import Nav from "$cmp/Nav.svelte";
	import Footer from "$cmp/Footer.svelte";
	import ThemeToggle from "$cmp/ThemeToggle.svelte";

	let { children } = $props();
</script>

<div class="theme-toggle-wrap">
	<ThemeToggle />
</div>

<TerminalHeader />

<div class="container">
	<Nav />

	{@render children()}

	<Footer />
</div>

<style>
	.container {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 24px;
	}

	@media (max-width: 600px) {
		.container {
			padding: 0 16px;
		}
	}

	.theme-toggle-wrap {
		position: fixed;
		top: 12px;
		right: 24px;
		z-index: 200;
	}

	@media (max-width: 600px) {
		.theme-toggle-wrap {
			right: 16px;
		}
	}
</style>
