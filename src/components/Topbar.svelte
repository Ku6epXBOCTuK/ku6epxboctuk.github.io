<script lang="ts">
	import { page } from "$app/state";
	import LangSwitch from "$cmp/LangSwitch.svelte";
	import ThemeToggle from "$cmp/ThemeToggle.svelte";
	import { langUrl, pageLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	const navItems = [
		{ path: "/", key: "home" },
		{ path: "/posts", key: "posts" },
		{ path: "/articles", key: "articles" },
		{ path: "/projects", key: "projects" },
		{ path: "/weekly", key: "weekly" },
	] as const;

	const lang = $derived(pageLang(page.data.lang));
	const t = $derived(ui(lang));
	const pathname = $derived(page.url.pathname.replace(/^\/(ru|en)(\/|$)/, "/"));

	function isActive(path: string): boolean {
		if (path === "/") return pathname === "/";
		return pathname === path || pathname.startsWith(path + "/");
	}
</script>

<nav class="topbar">
	<a class="brand" href={langUrl(lang, "/")}>
		<span class="brand-mark" aria-hidden="true">✦</span>
		<span>xboct<span class="brand-dot">.</span>dev</span>
	</a>

	<div class="nav-links">
		{#each navItems as item (item.path)}
			<a href={langUrl(lang, item.path)} class:active={isActive(item.path)}>
				{t.nav[item.key]}
			</a>
		{/each}
	</div>

	<div class="nav-actions">
		<LangSwitch />
		<ThemeToggle />
	</div>
</nav>

<style>
	.topbar {
		width: min(1120px, calc(100% - 40px));
		margin: 0 auto;
		min-height: 76px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		border-bottom: 1px solid var(--line);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 9px;
		font-family: var(--font-display);
		font-weight: 800;
		letter-spacing: -0.04em;
		font-size: 20px;
		color: var(--foreground);
		text-decoration: none;
		white-space: nowrap;
	}

	.brand-mark,
	.brand-dot {
		color: var(--coral);
	}

	.nav-links {
		display: flex;
		gap: 26px;
		color: var(--muted-foreground);
		font-family: var(--font-display);
		font-size: 14px;
	}

	.nav-links a {
		text-decoration: none;
		color: inherit;
		transition: color 0.2s ease;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: var(--foreground);
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	@media (max-width: 700px) {
		.topbar {
			width: calc(100% - 28px);
		}

		.nav-links {
			gap: 16px;
			font-size: 13px;
		}
	}
</style>
