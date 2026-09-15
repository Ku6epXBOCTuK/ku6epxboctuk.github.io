<script lang="ts">
	export type Tone = "default" | "mood" | "status";

	export interface Row {
		cmd: string;
		value: string;
		tone?: Tone;
	}

	interface Props {
		title: string;
		rows: Row[];
	}

	let { title, rows }: Props = $props();
</script>

<div class="window window-terminal">
	<div class="window-titlebar">
		<div class="window-dots">
			<span class="window-dot r"></span>
			<span class="window-dot y"></span>
			<span class="window-dot g"></span>
		</div>
		<span class="window-title">{title}</span>
	</div>
	<div class="terminal-body">
		{#each rows as row, i (row.cmd + i)}
			<span class="terminal-prompt">&gt; {row.cmd}</span>
			{#if row.tone === "status"}
				<strong class="terminal-status"><i class="dot"></i>{row.value}</strong>
			{:else}
				<strong class:terminal-mood={row.tone === "mood"}>{row.value}</strong>
			{/if}
		{/each}
	</div>
</div>

<style>
	.window {
		border: 2px solid transparent;
		border-radius: 14px;
		background:
			linear-gradient(var(--window), var(--window)) padding-box,
			linear-gradient(to bottom right, var(--outline), var(--shadow)) border-box;
		box-shadow: var(--hard-shadow);
		overflow: hidden;
	}

	.window-titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 14px;
		background: var(--titlebar);
		border-bottom: 2px solid var(--outline);
	}

	.window-dots {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.window-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1.5px solid var(--outline);
		background: transparent;
	}

	.window-title {
		margin-left: 8px;
		font-family: var(--font-display);
		font-size: 12px;
		letter-spacing: 0.05em;
		color: var(--outline);
	}

	.terminal-body {
		padding: 26px 22px;
		background: var(--term-bg);
		color: var(--term-fg);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.terminal-prompt {
		color: var(--term-prompt);
		font-size: 12px;
		margin-top: 10px;
	}

	.terminal-body strong {
		font-weight: 600;
		font-size: 15px;
	}

	.terminal-mood {
		color: var(--term-mood);
	}

	.terminal-status {
		display: flex;
		align-items: center;
		gap: 7px;
		color: var(--term-status);
	}

	.terminal-status .dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--term-status);
	}

	:global([data-skin="soft"]) .window {
		border: 1px solid var(--line);
		border-radius: 18px;
		box-shadow: var(--shadow);
	}

	:global([data-skin="soft"]) .window-titlebar {
		background: var(--term-bg);
		border-bottom: 1px solid var(--line);
	}

	:global([data-skin="soft"]) .window-dot {
		border: none;
	}

	:global([data-skin="soft"]) .window-dot.r {
		background: var(--dot-pink);
	}

	:global([data-skin="soft"]) .window-dot.y {
		background: var(--dot-mint);
	}

	:global([data-skin="soft"]) .window-dot.g {
		background: var(--dot-blue);
	}
</style>
