<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		href?: string;
		draft?: boolean;
		children: Snippet;
	}

	let { href, draft = false, children }: Props = $props();
</script>

{#if href}
	<a {href} class="card">
		{@render children()}
		{#if draft}
			<span class="draft-badge">draft</span>
		{/if}
	</a>
{:else}
	<div class="card">
		{@render children()}
		{#if draft}
			<span class="draft-badge">draft</span>
		{/if}
	</div>
{/if}

<style>
	.card {
		position: relative;
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

	.draft-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--coral);
		color: var(--primary-foreground);
		box-shadow: var(--hard-shadow);
	}
</style>
