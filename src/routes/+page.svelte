<script lang="ts">
	import { onMount } from "svelte";

	const RANDOM_TYPING_BASE = 30;
	const RANDOM_TYPING_SPREAD = 50;
	const COMMAND_TIMEOUT = 2000;

	let activePage = $state("home");
	let asciiText = $state("");
	let asciiFinished = $state(false);
	let commandInput = $state("");
	let commandOutput = $state<{ cmd: string; result: string; isError?: boolean } | null>(
		null
	);
	let inputRef: HTMLInputElement | undefined = $state();

	const ascii = `
██╗  ██╗██╗   ██╗ ██████╗ ███████╗██████╗ ██╗  ██╗██████╗  ██████╗  ██████╗████████╗██╗   ██╗██╗  ██╗
██║ ██╔╝██║   ██║██╔════╝ ██╔════╝██╔══██╗╚██╗██╔╝██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝██║   ██║██║ ██╔╝
████╔╝  ██║   ██║███████╗ █████╗  ██████╔╝ ╚███╔╝ ██████╔╝██║   ██║██║        ██║   ██║   ██║█████╔╝ 
██╔═██╗ ██║   ██║██╔═══██╗██╔══╝  ██╔═══╝  ██╔██╗ ██╔══██╗██║   ██║██║        ██║   ██║   ██║██╔═██╗ 
██║  ██╗╚██████╔╝╚██████╔╝███████╗██║     ██╔╝ ██╗██████╔╝╚██████╔╝╚██████╗   ██║   ╚██████╔╝██║  ██╗
╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
`;

	const commands: Record<string, string | ((_input: string) => string)> = {
		help: "available commands: help, about, projects, writings, contact, clear, date, whoami",
		about: () => {
			activePage = "about";
			return "→ switching to about page...";
		},
		projects: () => {
			activePage = "projects";
			return "→ switching to projects page...";
		},
		writings: () => {
			activePage = "writings";
			return "→ switching to writings page...";
		},
		contact: "email: Ku6epXBOCTuK@gmail.com",
		whoami: "Ku6epXBOCTuK — developer & creative technologist",
		date: () =>
			new Date().toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
		clear: "clear",
	};

	function switchPage(page: string) {
		activePage = page;
		window.scrollTo({ top: 0 });
	}

	function typeAscii() {
		let i = 0;
		const interval = setInterval(
			() => {
				if (i < ascii.length) {
					asciiText = ascii.substring(0, i + 1);
					i++;
				} else {
					asciiFinished = true;
					clearInterval(interval);
				}
			},
			RANDOM_TYPING_BASE + Math.random() * RANDOM_TYPING_SPREAD,
		);
	}

	function handleCommand(e: KeyboardEvent) {
		if (e.key === "Enter") {
			const cmd = commandInput.trim().toLowerCase();
			commandOutput = null;

			if (cmd === "clear") {
				commandOutput = null;
			} else if (commands[cmd]) {
				const handler = commands[cmd];
				if (typeof handler === "function") {
					commandOutput = { cmd, result: handler(cmd) };
				} else {
					commandOutput = { cmd, result: handler };
				}
			} else if (cmd !== "") {
				commandOutput = {
					cmd,
					result: `command not found: ${cmd}\ntype 'help' for available commands`,
					isError: true,
				};
			}

			commandInput = "";
		}
	}

	function focusInput() {
		inputRef?.focus();
	}

	onMount(() => {
		typeAscii();
		setTimeout(focusInput, COMMAND_TIMEOUT);
	});
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === "i" && document.activeElement !== inputRef) {
			e.preventDefault();
			focusInput();
		}
	}}
/>

<div class="terminal-header">
	<div class="terminal-dot r"></div>
	<div class="terminal-dot y"></div>
	<div class="terminal-dot g"></div>
	<span class="terminal-title">Ku6epXBOCTuK@portfolio ~ /home</span>
</div>

<div class="container">
	<nav class="nav">
		<div class="nav-prompt">
			<span class="prompt-char">➜</span> ~/Ku6epXBOCTuK $
			<span class="cmd">ls</span>
		</div>
		<div class="nav-tabs">
			<button
				class="nav-tab"
				class:active={activePage === "home"}
				onclick={() => switchPage("home")}>home</button
			>
			<button
				class="nav-tab"
				class:active={activePage === "about"}
				onclick={() => switchPage("about")}>about</button
			>
			<button
				class="nav-tab"
				class:active={activePage === "projects"}
				onclick={() => switchPage("projects")}>projects</button
			>
			<button
				class="nav-tab"
				class:active={activePage === "writings"}
				onclick={() => switchPage("writings")}>writings</button
			>
		</div>
	</nav>

	{#if activePage === "home"}
		<div class="home-ascii">
			<span class="ascii-text">{asciiText}</span>
			{#if !asciiFinished}
				<span class="cursor">█</span>
			{/if}
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
				building products, writing code, exploring creative coding and
				generative art.
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
					<a href="https://www.twitch.tv/Ku6ep_XBOCTuK" target="_blank"
						>twitch</a
					>
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
				bind:this={inputRef}
				bind:value={commandInput}
				onkeydown={handleCommand}
				type="text"
				class="command-input"
				placeholder="type 'help' for commands..."
				autocomplete="off"
				spellcheck="false"
			/>
		</div>
		{#if commandOutput}
			<div class="command-output show">
				<span class="prompt">$</span> <span class="cmd">{commandOutput.cmd}</span><br />
				{#if commandOutput.isError}
					<span class="error">{commandOutput.result}</span>
				{:else}
					<span class="result">{commandOutput.result}</span>
				{/if}
			</div>
		{/if}
	{/if}

	{#if activePage === "about"}
		<div class="section-title">about</div>

		<div class="about-text">
			<p>
				developer based in middle of Russia. frontend-leaning — svelte, rust,
				tauri, creative coding, and polished interfaces.
			</p>
			<p>
				it started in school — installing and configuring software, then diving
				into programming. wrote my first programs in pascal abc and later
				implemented modbus rtu protocol on atmega328.
			</p>
			<p>
				since 2016 i've been doing freelance (html/css/js/wordpress), then
				2018-2019 — built a ui kit on react for an hr analytics company. from
				2019 worked on internal tools for a us-based provider using svelte 3.
			</p>
			<p>
				from 2023 to march 2026 i worked on a desktop app project — svelte +
				rust + tauri. the project is now complete and i'm open to new
				opportunities.
			</p>
			<p>
				when not coding: sleeping, generative art, writing, and going down
				rabbit holes on obscure tech topics.
			</p>
		</div>

		<div class="section-title" style="margin-top: 40px">skills</div>
		<table class="skills-table">
			<tbody>
				<tr><td>frontend</td><td>svelte, rust, tauri, typescript</td></tr>
				<tr
					><td>creative</td><td
						>three.js, pixi.js, webgl, glsl, canvas, shaders</td
					></tr
				>
				<tr><td>backend</td><td>rust, sql, wasm, node</td></tr>
				<tr><td>infra</td><td>cloud, docker, ci/cd</td></tr>
				<tr><td>design</td><td>figma, ui/ux, design systems</td></tr>
			</tbody>
		</table>

		<div class="section-title" style="margin-top: 40px">experience</div>

		<div class="exp-item">
			<div class="exp-header">
				<span class="exp-role">svelte + rust + tauri</span>
				<span class="exp-date">2023 — mar 2026</span>
			</div>
			<div class="exp-company">product project</div>
			<div class="exp-desc">software-hardware solution. project completed.</div>
		</div>

		<div class="exp-item">
			<div class="exp-header">
				<span class="exp-role">frontend developer</span>
				<span class="exp-date">2019 — 2023</span>
			</div>
			<div class="exp-company">hosting provider</div>
			<div class="exp-desc">
				built admin panel for hosting and domain management on svelte 3.
			</div>
		</div>

		<div class="exp-item">
			<div class="exp-header">
				<span class="exp-role">frontend developer</span>
				<span class="exp-date">2018 — 2019</span>
			</div>
			<div class="exp-company">hr analytics company</div>
			<div class="exp-desc">created ui kit on react.</div>
		</div>

		<div class="exp-item">
			<div class="exp-header">
				<span class="exp-role">freelance developer</span>
				<span class="exp-date">2016 — 2018</span>
			</div>
			<div class="exp-company">freelance</div>
			<div class="exp-desc">
				html, css, js, wordpress — sites for local businesses.
			</div>
		</div>

		<div class="exp-item">
			<div class="exp-header">
				<span class="exp-role">programming</span>
				<span class="exp-date">school</span>
			</div>
			<div class="exp-company">self-taught</div>
			<div class="exp-desc">
				pascal abc, modbus rtu on atmega328, software installation &
				configuration.
			</div>
		</div>
	{/if}

	{#if activePage === "projects"}
		<div class="section-title">projects</div>

		<div class="project-item">
			<div class="project-screenshot">
				<div class="screenshot-bar">
					<div class="dot-sm r"></div>
					<div class="dot-sm y"></div>
					<div class="dot-sm g"></div>
					<span class="url">github.com/Ku6epXBOCTuK/itd</span>
				</div>
				<img src="images/itd.jpg" alt="itd" />
			</div>
			<div class="project-name">
				<a href="https://github.com/Ku6epXBOCTuK/itd" target="_blank">itd</a>
			</div>
			<div class="project-meta"><span>game</span> · idle tower defence</div>
			<div class="project-desc">
				idle tower defence game built with three.js and miniplex ecs. enemies
				walk along a path, player places towers to defeat them. resources
				accumulate passively, allowing for strategic upgrades even when not
				actively playing.
			</div>
			<div class="project-tech">
				<span>three.js</span><span>miniplex</span><span>svelte</span>
			</div>
		</div>

		<div class="project-item">
			<div class="project-screenshot">
				<div class="screenshot-bar">
					<div class="dot-sm r"></div>
					<div class="dot-sm y"></div>
					<div class="dot-sm g"></div>
					<span class="url">github.com/Ku6epXBOCTuK/XBOCT-page</span>
				</div>
				<img src="images/xboct-page.jpg" alt="XBOCT-page" />
			</div>
			<div class="project-name">
				<a href="https://github.com/Ku6epXBOCTuK/XBOCT-page" target="_blank"
					>XBOCT-page</a
				>
			</div>
			<div class="project-meta">
				<span>extension</span> · newtab replacement
			</div>
			<div class="project-desc">
				chrome extension that replaces the newtab page. offline-first approach.
			</div>
			<div class="project-tech">
				<span>svelte 5</span><span>typescript</span><span>vite</span>
			</div>
		</div>

		<div class="project-item">
			<div class="project-screenshot">
				<div class="screenshot-bar">
					<div class="dot-sm r"></div>
					<div class="dot-sm y"></div>
					<div class="dot-sm g"></div>
					<span class="url">github.com/Ku6epXBOCTuK/twitch-panels</span>
				</div>
				<img src="images/twitch-panels.jpg" alt="twitch-panels" />
			</div>
			<div class="project-name">
				<a href="https://github.com/Ku6epXBOCTuK/twitch-panels" target="_blank"
					>twitch-panels</a
				>
			</div>
			<div class="project-meta"><span>tool</span> · twitch panels creator</div>
			<div class="project-desc">
				visual editor for creating custom twitch panels.
			</div>
			<div class="project-tech">
				<span>svelte 5</span><span>konva.js</span><span>typescript</span>
			</div>
		</div>

		<div class="project-item">
			<div class="project-screenshot">
				<div class="screenshot-bar">
					<div class="dot-sm r"></div>
					<div class="dot-sm y"></div>
					<div class="dot-sm g"></div>
					<span class="url">github.com/Ku6epXBOCTuK/now_playing</span>
				</div>
				<img src="images/now-playing.jpg" alt="now_playing" />
			</div>
			<div class="project-name">
				<a href="https://github.com/Ku6epXBOCTuK/now_playing" target="_blank"
					>now_playing</a
				>
			</div>
			<div class="project-meta"><span>widget</span> · obs browser source</div>
			<div class="project-desc">
				obs browser source widget that displays the currently playing track.
			</div>
			<div class="project-tech">
				<span>html</span><span>css</span><span>javascript</span>
			</div>
		</div>
	{/if}

	{#if activePage === "writings"}
		<div class="section-title">writings</div>

		<div class="writing-item">
			<div class="writing-header">
				<span class="writing-title"
					>offline-first chrome extension: lessons from building XBOCT-page</span
				>
				<span class="exp-date">apr 2026</span>
			</div>
			<div class="writing-excerpt">
				why i switched from start.me to building my own extension, how
				offline-first architecture eliminates loading delays.
			</div>
			<div class="writing-tag"># engineering # creative</div>
		</div>

		<div class="writing-item">
			<div class="writing-header">
				<span class="writing-title"
					>github ci with cocogitto: a day of debugging rulesets and tokens</span
				>
				<span class="exp-date">mar 2026</span>
			</div>
			<div class="writing-excerpt">
				what should have been an hour turned into a full day.
			</div>
			<div class="writing-tag"># engineering # devops</div>
		</div>

		<div class="writing-item">
			<div class="writing-header">
				<span class="writing-title">building an ecs for a browser game</span>
				<span class="exp-date">mar 2026</span>
			</div>
			<div class="writing-excerpt">
				using miniplex with three.js for an idle tower defence.
			</div>
			<div class="writing-tag"># engineering # gamedev</div>
		</div>

		<div class="writing-item">
			<div class="writing-header">
				<span class="writing-title"
					>sveltekit static adapter: tips i learned the hard way</span
				>
				<span class="exp-date">feb 2026</span>
			</div>
			<div class="writing-excerpt">
				adapter-static is simple until it isn't.
			</div>
			<div class="writing-tag"># tutorial</div>
		</div>

		<div class="writing-item">
			<div class="writing-header">
				<span class="writing-title"
					>why i stopped using ui component libraries</span
				>
				<span class="exp-date">jan 2026</span>
			</div>
			<div class="writing-excerpt">
				building ui from scratch gives you exactly what you need.
			</div>
			<div class="writing-tag"># design</div>
		</div>
	{/if}

	<footer class="footer">
		built with vscode and couple cups of tea <span class="blink">_</span><br
		/><br />
		<a href="https://github.com/Ku6epXBOCTuK" target="_blank">github</a> ·
		<a href="https://t.me/Ku6epXBOCTuK_feed" target="_blank">telegram</a> ·
		<a href="https://www.twitch.tv/Ku6ep_XBOCTuK" target="_blank">twitch</a> ·
		<a href="https://Ku6epXBOCTuK.github.io" target="_blank">this site</a> ·
		<a href="mailto:Ku6epXBOCTuK@gmail.com">email</a>
	</footer>
</div>

<div class="status-bar">
	<span><span class="mode">NORMAL</span></span>
	<span>utf-8 · svelte</span>
</div>

<style>
	.container {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 24px;
	}

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

	.nav {
		padding: 40px 0 30px;
	}

	.nav-prompt {
		color: var(--dim);
		font-size: 12px;
		margin-bottom: 20px;
	}

	.nav-prompt .prompt-char {
		color: var(--accent);
	}

	.nav-prompt .cmd {
		color: var(--accent3);
	}

	.nav-tabs {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
	}

	.nav-tab {
		padding: 6px 16px;
		color: var(--dim);
		text-decoration: none;
		font-size: 13px;
		font-family: var(--mono);
		cursor: pointer;
		transition: color 0.2s;
		background: none;
		border: none;
		position: relative;
	}

	.nav-tab:hover {
		color: var(--fg);
	}

	.nav-tab.active {
		color: var(--accent);
	}

	.nav-tab.active::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 16px;
		right: 16px;
		height: 1px;
		background: var(--accent);
	}

	.home-ascii {
		color: var(--dim);
		font-size: 10px;
		line-height: 1.2;
		margin: 30px 0;
		white-space: pre;
		overflow-x: auto;
		font-family: var(--ascii-font);
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

	.section-title {
		color: var(--accent);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 24px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}

	.section-title::before {
		content: "# ";
		color: var(--dim);
	}

	.about-text {
		margin: 20px 0;
		color: var(--fg);
	}

	.about-text p {
		margin-bottom: 16px;
	}

	.skills-table {
		width: 100%;
		margin: 30px 0;
		border-collapse: collapse;
	}

	.skills-table td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		font-size: 13px;
	}

	.skills-table td:first-child {
		color: var(--accent3);
		width: 40%;
	}

	.skills-table td:last-child {
		color: var(--fg);
	}

	.exp-item {
		margin: 24px 0;
		padding-left: 16px;
		border-left: 1px solid var(--border);
	}

	.exp-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 4px;
	}

	.exp-role {
		color: var(--fg);
		font-weight: 500;
	}

	.exp-date {
		color: var(--dim);
		font-size: 12px;
	}

	.exp-company {
		color: var(--accent2);
		font-size: 13px;
		margin-bottom: 6px;
	}

	.exp-desc {
		color: var(--dim);
		font-size: 13px;
	}

	.project-item {
		margin: 40px 0;
		padding-bottom: 40px;
		border-bottom: 1px solid var(--border);
	}

	.project-item:last-child {
		border-bottom: none;
	}

	.project-screenshot {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 4px;
		margin-bottom: 16px;
		overflow: hidden;
		position: relative;
		background: #111;
	}

	.project-screenshot::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.05) 2px,
			rgba(0, 0, 0, 0.05) 4px
		);
		pointer-events: none;
		z-index: 2;
	}

	.project-screenshot img {
		width: 100%;
		display: block;
		filter: brightness(0.85) contrast(1.1);
		transition:
			filter 0.3s ease,
			transform 0.3s ease;
	}

	.project-screenshot:hover img {
		filter: brightness(0.95) contrast(1.05);
		transform: scale(1.01);
	}

	.project-screenshot .screenshot-bar {
		padding: 8px 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		border-bottom: 1px solid var(--border);
		background: #0e0e0e;
	}

	.screenshot-bar .dot-sm {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.screenshot-bar .dot-sm.r {
		background: #ff5f57;
	}
	.screenshot-bar .dot-sm.y {
		background: #febc2e;
	}
	.screenshot-bar .dot-sm.g {
		background: #28c840;
	}

	.screenshot-bar .url {
		margin-left: 10px;
		font-size: 11px;
		color: var(--dim);
	}

	.project-name {
		color: var(--accent);
		font-weight: 600;
		font-size: 15px;
		margin-bottom: 4px;
	}

	.project-name a {
		color: inherit;
		text-decoration: none;
	}

	.project-name a:hover {
		text-decoration: underline;
	}

	.project-meta {
		color: var(--dim);
		font-size: 12px;
		margin-bottom: 8px;
	}

	.project-meta span {
		color: var(--accent2);
	}

	.project-desc {
		color: var(--fg);
		font-size: 13px;
		margin-bottom: 10px;
	}

	.project-tech {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.project-tech span {
		font-size: 11px;
		padding: 2px 8px;
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--dim);
	}

	.writing-item {
		margin: 24px 0;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--border);
	}

	.writing-item:last-child {
		border-bottom: none;
	}

	.writing-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.writing-title {
		color: var(--fg);
		font-weight: 500;
		font-size: 14px;
		text-decoration: none;
		cursor: pointer;
	}

	.writing-title:hover {
		color: var(--accent);
	}

	.writing-excerpt {
		color: var(--dim);
		font-size: 13px;
		line-height: 1.6;
	}

	.writing-tag {
		color: var(--accent3);
		font-size: 11px;
		margin-top: 8px;
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

	.blink {
		animation: blink 1s step-end infinite;
		color: var(--accent);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.footer {
		margin-top: 80px;
		padding: 20px 0 40px;
		border-top: 1px solid var(--border);
		text-align: center;
		color: var(--dim);
		font-size: 12px;
	}

	.footer a {
		color: var(--accent2);
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	.status-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 4px 24px;
		border-top: 1px solid var(--border);
		background: var(--bg);
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--dim);
		z-index: 100;
	}

	.status-bar .mode {
		color: var(--bg);
		background: var(--accent);
		padding: 1px 8px;
	}

	@media (max-width: 600px) {
		.container {
			padding: 0 16px;
		}
		.home-ascii {
			font-size: 7px;
		}
		.nav-tabs {
			gap: 0;
		}
		.nav-tab {
			padding: 6px 10px;
			font-size: 12px;
		}
		.exp-header {
			flex-direction: column;
			gap: 2px;
		}
		.project-screenshot .url {
			display: none;
		}
	}
</style>
