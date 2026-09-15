<script lang="ts">
	import { page } from "$app/state";
	import { otherLang, pageLang } from "$lib/content";
	import { ui } from "$lib/i18n";
	import type { Project } from "$lib/projects";

	interface Props {
		meta: Project;
		alt: Project;
	}

	let { meta, alt }: Props = $props();

	const lang = $derived(pageLang(page.data.lang));
	const altLang = $derived(otherLang(lang));
	const t = $derived(ui(lang));

	let showAlt = $state(false);

	const shown = $derived(showAlt ? alt : meta);
	const label = $derived(ui(showAlt ? lang : altLang).readIn);

	const icon = $derived(shown.icon ?? "✦");
	const colorClass = $derived(
		shown.color === "periwinkle"
			? "periwinkle"
			: shown.color === "sky"
				? "sky"
				: "coral",
	);
</script>

<article class="project-detail">
	<div class="detail-head">
		<div class="detail-title-group">
			<span class="project-icon {colorClass}">{icon}</span>
			<div class="detail-titles">
				<h1 class="detail-title">{shown.title}</h1>
				{#if shown.subtitle}
					<div class="detail-subtitle">{shown.subtitle}</div>
				{/if}
			</div>
		</div>
		<div class="detail-side">
			{#if shown.status}
				<span class="status-badge">{shown.status}</span>
			{/if}
			<button class="detail-toggle" onclick={() => (showAlt = !showAlt)}>
				{label}
			</button>
		</div>
	</div>

	{#if shown.description}
		<p class="project-description">{shown.description}</p>
	{/if}

	{#if shown.image}
		<div class="project-screenshot">
			<img src={shown.image} alt={shown.title} />
		</div>
	{/if}

	{#if shown.tags.length}
		<div class="project-tags">
			{#each shown.tags as tag (tag)}
				<span class="tag">#{tag}</span>
			{/each}
		</div>
	{/if}

	<div class="project-links">
		{#if shown.repo}
			<a
				class="project-link"
				href={shown.repo}
				target="_blank"
				rel="noreferrer"
			>
				{t.project.repo} ↗
			</a>
		{/if}
		{#if shown.demo}
			<a
				class="project-link"
				href={shown.demo}
				target="_blank"
				rel="noreferrer"
			>
				{t.project.demo} ↗
			</a>
		{/if}
	</div>
</article>

<style>
	.project-detail {
		max-width: 100%;
	}

	.detail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}

	.detail-title-group {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}

	.project-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		font-size: 20px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--window);
	}

	.project-icon.coral {
		color: var(--coral);
	}

	.project-icon.periwinkle {
		color: var(--periwinkle);
	}

	.project-icon.sky {
		color: var(--sky);
	}

	.detail-titles {
		min-width: 0;
	}

	.detail-title {
		color: var(--foreground);
		font-size: 24px;
		font-weight: 600;
		margin: 0;
	}

	.detail-subtitle {
		color: var(--muted-foreground);
		font-size: 13px;
		margin-top: 2px;
	}

	.detail-side {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.status-badge {
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border: 1px solid var(--outline);
		border-radius: 6px;
		color: var(--muted-foreground);
		white-space: nowrap;
	}

	.detail-toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-display);
		font-size: 13px;
		font-weight: 700;
		padding: 12px 17px;
		border-radius: 10px;
		border: 2px solid var(--outline);
		background: var(--window);
		color: var(--foreground);
		cursor: pointer;
		white-space: nowrap;
		transition: transform 0.15s ease;
	}

	.detail-toggle:hover {
		transform: translateY(-1px);
	}

	:global([data-skin="soft"]) .detail-toggle {
		border-radius: 12px;
		border-width: 1px;
	}

	.project-description {
		color: var(--foreground);
		font-size: 15px;
		line-height: 1.7;
		margin: 0 0 24px;
	}

	.project-screenshot {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 24px;
		background: var(--window);
	}

	.project-screenshot img {
		width: 100%;
		display: block;
	}

	.project-tags {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}

	.tag {
		font-size: 11px;
		color: var(--sky);
	}

	.project-links {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}

	.project-link {
		color: var(--coral);
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
	}

	.project-link:hover {
		text-decoration: underline;
	}
</style>
