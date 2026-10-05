<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
		[key: string]: unknown;
	}

	let { children, ...rest }: Props = $props();
</script>

<div class="section-title" {...rest}>
	{@render children()}
</div>

<style>
	.section-title {
		color: var(--coral);
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		margin-bottom: 28px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--outline);
	}

	.section-title::before {
		content: "# ";
		color: var(--muted-foreground);
	}
</style>
