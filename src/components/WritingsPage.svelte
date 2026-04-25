<script lang="ts">
	const writings = [
		{
			title: "offline-first chrome extension: lessons from building XBOCT-page",
			date: "apr 2026",
			excerpt:
				"why i switched from start.me to building my own extension, how offline-first architecture eliminates loading delays.",
			tag: "# engineering # creative",
		},
		{
			title: "github ci with cocogitto: a day of debugging rulesets and tokens",
			date: "mar 2026",
			excerpt: "what should have been an hour turned into a full day.",
			tag: "# engineering # devops",
		},
		{
			title: "building an ecs for a browser game",
			date: "mar 2026",
			excerpt: "using miniplex with three.js for an idle tower defence.",
			tag: "# engineering # gamedev",
		},
		{
			title: "sveltekit static adapter: tips i learned the hard way",
			date: "feb 2026",
			excerpt: "adapter-static is simple until it isn't.",
			tag: "# tutorial",
		},
		{
			title: "why i stopped using ui component libraries",
			date: "jan 2026",
			excerpt: "building ui from scratch gives you exactly what you need.",
			tag: "# design",
		},
	];
</script>

<div class="section-title">writings</div>

{#each writings as writing (writing.title)}
	<div class="writing-item">
		<div class="writing-header">
			<span class="writing-title">{writing.title}</span>
			<span class="writing-date">{writing.date}</span>
		</div>
		<div class="writing-excerpt">{writing.excerpt}</div>
		<div class="writing-tag">{writing.tag}</div>
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

	.writing-date {
		color: var(--dim);
		font-size: 12px;
		white-space: nowrap;
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
</style>
