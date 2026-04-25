<script lang="ts">
	interface Props {
		title?: string;
	}

	let { title = "Ku6epXBOCTuK@portfolio ~ /home" }: Props = $props();
</script>

<div class="terminal-header">
	<div class="terminal-dot r"></div>
	<div class="terminal-dot y"></div>
	<div class="terminal-dot g"></div>
	<span class="terminal-title">{title}</span>
</div>

<style>
	.terminal-header {
		padding: 12px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 8px;
		position: sticky;
		top: 0;
		background: rgba(10, 10, 10, 0.9);
		backdrop-filter: blur(10px);
		z-index: 100;
	}

	.terminal-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.terminal-dot.r {
		background: #ff5f57;
	}
	.terminal-dot.y {
		background: #febc2e;
	}
	.terminal-dot.g {
		background: #28c840;
	}

	.terminal-title {
		margin-left: 12px;
		color: var(--dim);
		font-size: 12px;
	}
</style>
