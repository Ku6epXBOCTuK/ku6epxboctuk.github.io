<script lang="ts">
	import "../app.css";
	import TerminalHeader from "$cmp/TerminalHeader.svelte";
	import Nav from "$cmp/Nav.svelte";
	import Footer from "$cmp/Footer.svelte";

	let { children } = $props();
</script>

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
</style>
