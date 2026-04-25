<script lang="ts">
	import { page } from "$app/stores";

	const navItems = [
		{ href: "/", label: "home" },
		{ href: "/about", label: "about" },
		{ href: "/projects", label: "projects" },
		{ href: "/writings", label: "writings" },
	];

	function getActivePage(pathname: string): string {
		if (pathname === "/" || pathname === "") return "home";
		return pathname.replace("/", "");
	}
</script>

<nav class="nav">
	<div class="nav-prompt">
		<span class="prompt-char">➜</span> ~/Ku6epXBOCTuK $
		<span class="cmd">ls</span>
	</div>
	<div class="nav-tabs">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				class="nav-tab"
				class:active={getActivePage($page.url.pathname) === item.label}
			>
				{item.label}
			</a>
		{/each}
	</div>
</nav>

<style>
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
</style>
