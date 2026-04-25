<script lang="ts">
	import { ASCII_ART } from "$lib/ascii";
	import { onMount } from "svelte";

	const FOCUS_DELAY = 2000;
	const TYPING_BASE = 30;
	const TYPING_SPREAD = 50;

	interface Props {
		commandInput?: string;
		commandOutput?: { cmd: string; result: string; isError?: boolean } | null;
		onCommand?: (_e: KeyboardEvent) => void;
		onFocus?: () => void;
	}

	let {
		commandInput = $bindable(""),
		commandOutput = $bindable(null),
		onCommand,
		onFocus,
	}: Props = $props();

	let typedText = $state("");
	let typedIndex = $state(0);
	let localInputRef: HTMLInputElement | undefined = $state();

	function typeAscii() {
		if (typedIndex < ASCII_ART.length) {
			typedText = ASCII_ART.substring(0, typedIndex + 1);
			typedIndex++;
		}
	}

	function startTyping() {
		typeAscii();
		const interval = setInterval(
			() => {
				if (typedIndex < ASCII_ART.length) {
					typeAscii();
				} else {
					clearInterval(interval);
				}
			},
			TYPING_BASE + Math.random() * TYPING_SPREAD,
		);
	}

	onMount(() => {
		startTyping();
		setTimeout(() => {
			localInputRef?.focus();
			onFocus?.();
		}, FOCUS_DELAY);
	});
</script>

<div class="home-ascii">
	<pre class="placeholder">{ASCII_ART}</pre>
	<pre class="typed"><span class="text">{typedText}</span><span class="cursor"
			>█</span
		></pre>
</div>

<div class="home-intro">
	<div><span class="cmd">$</span> whoami</div>
	<div class="output">Ku6epXBOCTuK — developer & creative technologist</div>
	<div class="comment">
		// i build things for the web. mostly interesting, sometimes useful.
	</div>
</div>

<div class="home-intro">
	<div><span class="cmd">$</span> cat currently-doing.txt</div>
	<div class="output">
		building products, writing code, exploring creative coding and generative
		art.
	</div>
</div>

<div class="home-intro">
	<div><span class="cmd">$</span> ls -la ~/links/</div>
	<ul class="home-links">
		<li>
			<a href="https://github.com/Ku6epXBOCTuK" target="_blank">github</a>
			<span class="desc"># where the code lives</span>
		</li>
		<li>
			<a href="https://t.me/Ku6epXBOCTuK_feed" target="_blank">telegram</a>
			<span class="desc"># short thoughts & threads</span>
		</li>
		<li>
			<a href="https://www.twitch.tv/Ku6ep_XBOCTuK" target="_blank">twitch</a>
			<span class="desc"># coding streams</span>
		</li>
		<li>
			<a href="mailto:Ku6epXBOCTuK@gmail.com">email</a>
			<span class="desc"># reach out</span>
		</li>
	</ul>
</div>

<div class="command-line">
	<span class="prompt">➜ ~ $</span>
	<input
		bind:this={localInputRef}
		bind:value={commandInput}
		onkeydown={onCommand}
		type="text"
		class="command-input"
		placeholder="type 'help' for commands..."
		autocomplete="off"
		spellcheck="false"
	/>
</div>

{#if commandOutput}
	<div class="command-output show">
		<span class="prompt">$</span>
		<span class="cmd">{commandOutput.cmd}</span><br />
		{#if commandOutput.isError}
			<span class="error">{commandOutput.result}</span>
		{:else}
			<span class="result">{commandOutput.result}</span>
		{/if}
	</div>
{/if}

<style>
	.home-ascii {
		background: var(--bg-ascii);
		padding: 8px 12px 40px;
		border-radius: 4px;
		font-size: 10px;
		line-height: 1.2;
		margin: 30px 0;
		font-family: var(--ascii-font);
		position: relative;
		overflow: hidden;
	}

	.home-ascii .placeholder {
		color: var(--dim);
		opacity: 0.1;
		margin: 0;
		pointer-events: none;
		white-space: pre;
	}

	.home-ascii .typed {
		color: var(--dim-light);
		margin: 0;
		position: absolute;
		top: 8px;
		left: 12px;
		right: 12px;
		bottom: 8px;
		white-space: pre;
	}

	.home-ascii .cursor {
		color: var(--accent);
		animation: blink 0.5s step-end infinite;
		font-weight: bold;
		font-size: 12px;
	}

	.home-intro {
		margin: 40px 0;
	}

	.home-intro .cmd {
		color: var(--accent);
		font-weight: 500;
	}

	.home-intro .output {
		color: var(--fg);
		margin: 8px 0 20px;
	}

	.home-intro .comment {
		color: var(--dim);
	}

	.home-links {
		margin: 30px 0;
		padding-left: 20px;
	}

	.home-links li {
		list-style: none;
		margin: 6px 0;
	}

	.home-links a {
		color: var(--accent2);
		text-decoration: none;
	}

	.home-links a:hover {
		text-decoration: underline;
	}

	.home-links .desc {
		color: var(--dim);
		margin-left: 8px;
	}

	.command-line {
		margin: 30px 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.command-line .prompt {
		color: var(--accent);
		white-space: nowrap;
	}

	.command-input {
		background: transparent;
		border: none;
		outline: none;
		color: var(--fg);
		font-family: var(--mono);
		font-size: 14px;
		flex: 1;
		caret-color: var(--accent);
	}

	.command-output {
		margin: 10px 0 20px;
		padding-left: 20px;
		color: var(--dim);
		font-size: 13px;
		display: none;
	}

	.command-output.show {
		display: block;
	}

	.command-output .prompt {
		color: var(--dim);
	}

	.command-output .cmd {
		color: var(--accent);
	}

	.command-output .result {
		color: var(--fg);
	}

	.command-output .error {
		color: var(--accent4);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
