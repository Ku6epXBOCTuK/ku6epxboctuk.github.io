<script lang="ts">
	import { page } from "$app/state";

	const problems = $derived(
		(page.data.problems as { broken: number } | undefined)?.broken ?? 0,
	);

	const SECTIONS = [
		{ href: "/posts", label: "посты" },
		{ href: "/articles", label: "статьи" },
		{ href: "/projects", label: "проекты" },
		{ href: "/tags", label: "теги" },
		{ href: "/errors", label: "ошибки" },
	];

	const path = $derived(page.url.pathname);
</script>

<header>
	<a class="mark" href="/">редактор</a>
	<nav>
		{#each SECTIONS as section (section.href)}
			<a
				href={section.href}
				aria-current={path.startsWith(section.href) || undefined}
			>
				{section.label}
				{#if section.href === "/errors" && problems > 0}
					<span class="dot" title="{problems} — не обойти"></span>
				{/if}
			</a>
		{/each}
	</nav>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		height: var(--header-h);
		padding-inline: var(--gutter);
		background: var(--ui-bg);
		border-bottom: 1px solid var(--ui-line);
	}

	.mark {
		font-size: var(--ui-fs-lg);
		font-weight: 600;
		color: var(--ui-fg);
		text-decoration: none;
		letter-spacing: var(--track-tight);
	}

	nav {
		margin-left: auto;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		gap: var(--ui-space-3);
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-secondary);
		text-decoration: none;
		padding: var(--pad-field);
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-control);
		background: var(--ui-surface);
	}

	nav a:hover {
		color: var(--ui-fg);
		border-color: var(--ui-line-strong);
	}

	nav a[aria-current] {
		color: var(--ui-fg);
		background: var(--ui-panel);
		border-color: var(--ui-line-strong);
	}

	.dot {
		width: var(--dot-size);
		height: var(--dot-size);
		border-radius: var(--ui-r-pill);
		background: var(--ui-danger);
	}
</style>
