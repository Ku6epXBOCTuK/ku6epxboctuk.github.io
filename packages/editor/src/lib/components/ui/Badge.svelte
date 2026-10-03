<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		tone?: "neutral" | "warn" | "danger";
		pill?: boolean;
		children: Snippet;
	}

	let { tone = "neutral", pill = false, children }: Props = $props();
</script>

<span class="badge {tone}" class:pill>
	{@render children()}
</span>

<style>
	.badge {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		padding: var(--pad-badge);
		border-radius: var(--r-chip);
		color: var(--text-dim);
		background: var(--surface-2);
	}

	.badge.pill {
		border-radius: var(--r-pill);
	}

	.badge.warn {
		color: var(--warn);
		background: var(--warn-wash);
	}

	.badge.danger {
		color: var(--danger);
		background: var(--danger-wash);
	}
</style>
