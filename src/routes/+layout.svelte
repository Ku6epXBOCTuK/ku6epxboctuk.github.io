<script lang="ts">
	import "../app.css";
	import Topbar from "$cmp/Topbar.svelte";
	import Footer from "$cmp/Footer.svelte";

	let { children } = $props();
</script>

<Topbar />

<div class="site-shell">
	{@render children()}
</div>

<Footer />

<style>
	.site-shell {
		width: min(1120px, calc(100% - 40px));
		margin: 0 auto;
		padding-top: 48px;
	}

	@media (max-width: 700px) {
		.site-shell {
			width: calc(100% - 28px);
			padding-top: 28px;
		}
	}
</style>
