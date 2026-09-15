<script lang="ts">
	import { getProjects } from "$lib/projects";

	let projects = getProjects();
</script>

<div class="section-title">projects</div>

{#each projects as project (project.slug)}
	<div class="project-item">
		<div class="project-screenshot">
			<div class="screenshot-bar">
				<div class="dot-sm r"></div>
				<div class="dot-sm y"></div>
				<div class="dot-sm g"></div>
				<span class="url">
					{project.repo?.replace("https://github.com/", "") ??
						project.demo ??
						""}
				</span>
			</div>
			{#if project.image}
				<img src={project.image} alt={project.title} />
			{/if}
		</div>
		<div class="project-name">
			<a href={project.repo ?? project.demo} target="_blank">{project.title}</a>
		</div>
		<div class="project-meta">{project.subtitle}</div>
		<div class="project-desc">{project.description}</div>
		<div class="project-tech">
			{#each project.tags as t (t)}
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
		background: var(--bg-light);
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
		background: var(--bg);
	}

	.screenshot-bar .dot-sm {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.screenshot-bar .dot-sm.r {
		background: var(--accent4);
	}

	.screenshot-bar .dot-sm.y {
		background: var(--accent3);
	}

	.screenshot-bar .dot-sm.g {
		background: var(--accent);
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
