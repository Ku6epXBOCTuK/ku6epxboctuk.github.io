<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		href?: string;
		children: Snippet;
	}

	let { href, children }: Props = $props();
</script>

{#if href}
	<a {href} class="card">
		{@render children()}
	</a>
{:else}
	<div class="card">
		{@render children()}
	</div>
{/if}

<style>
	.card {
		display: block;
		padding: 20px 24px;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--window);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	a.card:hover {
		transform: translateY(-2px);
		box-shadow: var(--hard-shadow);
	}

	:global([data-skin="soft"]) .card {
		border-radius: 16px;
		box-shadow: var(--shadow);
	}

	:global([data-skin="soft"]) a.card:hover {
		box-shadow: var(--shadow);
	}
</style>
