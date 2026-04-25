<script lang="ts">
	const projects = [
		{
			name: "itd",
			url: "https://github.com/Ku6epXBOCTuK/itd",
			type: "game",
			subtitle: "idle tower defence",
			desc: "idle tower defence game built with three.js and miniplex ecs. enemies walk along a path, player places towers to defeat them. resources accumulate passively, allowing for strategic upgrades even when not actively playing.",
			tech: ["three.js", "miniplex", "svelte"],
			image: "images/itd.jpg",
			imageUrl: "github.com/Ku6epXBOCTuK/itd",
		},
		{
			name: "XBOCT-page",
			url: "https://github.com/Ku6epXBOCTuK/XBOCT-page",
			type: "extension",
			subtitle: "newtab replacement",
			desc: "chrome extension that replaces the newtab page. offline-first approach.",
			tech: ["svelte 5", "typescript", "vite"],
			image: "images/xboct-page.jpg",
			imageUrl: "github.com/Ku6epXBOCTuK/XBOCT-page",
		},
		{
			name: "twitch-panels",
			url: "https://github.com/Ku6epXBOCTuK/twitch-panels",
			type: "tool",
			subtitle: "twitch panels creator",
			desc: "visual editor for creating custom twitch panels.",
			tech: ["svelte 5", "konva.js", "typescript"],
			image: "images/twitch-panels.jpg",
			imageUrl: "github.com/Ku6epXBOCTuK/twitch-panels",
		},
		{
			name: "now_playing",
			url: "https://github.com/Ku6epXBOCTuK/now_playing",
			type: "widget",
			subtitle: "obs browser source",
			desc: "obs browser source widget that displays the currently playing track.",
			tech: ["html", "css", "javascript"],
			image: "images/now-playing.jpg",
			imageUrl: "github.com/Ku6epXBOCTuK/now_playing",
		},
	];
</script>

<div class="section-title">projects</div>

{#each projects as project (project.name)}
	<div class="project-item">
		<div class="project-screenshot">
			<div class="screenshot-bar">
				<div class="dot-sm r"></div>
				<div class="dot-sm y"></div>
				<div class="dot-sm g"></div>
				<span class="url">{project.imageUrl}</span>
			</div>
			<img src={project.image} alt={project.name} />
		</div>
		<div class="project-name">
			<a href={project.url} target="_blank">{project.name}</a>
		</div>
		<div class="project-meta">
			<span>{project.type}</span> · {project.subtitle}
		</div>
		<div class="project-desc">{project.desc}</div>
		<div class="project-tech">
			{#each project.tech as t (t)}
				<span>{t}</span>
			{/each}
		</div>
	</div>
{/each}

<style>
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

	@media (max-width: 600px) {
		.project-screenshot .url {
			display: none;
		}
	}
</style>
