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
		gap: var(--gap-3);
		height: var(--header-h);
		padding-inline: var(--gutter);
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}

	.mark {
		font-size: var(--fs-brand);
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
		letter-spacing: var(--track-tight);
	}

	nav {
		margin-left: auto;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		gap: var(--gap-2);
		font-size: var(--fs-md);
		color: var(--text-dim);
		text-decoration: none;
		padding: var(--pad-field);
		border: 1px solid var(--line);
		border-radius: var(--r-control);
		background: var(--surface);
	}

	nav a:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}

	nav a[aria-current] {
		color: var(--text);
		background: var(--surface-2);
		border-color: var(--line-strong);
	}

	.dot {
		width: var(--dot-size);
		height: var(--dot-size);
		border-radius: var(--r-pill);
		background: var(--danger);
	}
</style>
