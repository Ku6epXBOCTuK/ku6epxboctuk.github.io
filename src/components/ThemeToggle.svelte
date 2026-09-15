<script lang="ts">
	const root =
		typeof document !== "undefined" ? document.documentElement : null;

	const SOFT_ICON = "</>";

	let skin = $state(
		root?.getAttribute("data-skin") === "soft" ? "soft" : "kawaii",
	);
	let theme = $state(root?.classList.contains("dark") ? "dark" : "light");

	function toggleSkin() {
		skin = skin === "kawaii" ? "soft" : "kawaii";
		root?.setAttribute("data-skin", skin);
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("skin", skin);
		}
	}

	function toggleTheme() {
		theme = theme === "dark" ? "light" : "dark";
		root?.classList.toggle("dark", theme === "dark");
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("theme", theme);
		}
	}
</script>

<div class="theme-toggle">
	<button
		class="chip"
		title={skin === "kawaii" ? "Switch to soft skin" : "Switch to kawaii skin"}
		aria-label={skin === "kawaii"
			? "Switch to soft skin"
			: "Switch to kawaii skin"}
		onclick={toggleSkin}
	>
		{#if skin === "kawaii"}
			<span class="skin-soft">{SOFT_ICON}</span>
		{:else}
			<span class="skin-kawaii" aria-hidden="true">🎀</span>
		{/if}
	</button>
	<button
		class="chip"
		title={theme === "light" ? "Dark mode" : "Light mode"}
		aria-label={theme === "light" ? "Dark mode" : "Light mode"}
		onclick={toggleTheme}
	>
		{theme === "light" ? "☾" : "☀"}
	</button>
</div>

<style>
	.theme-toggle {
		display: flex;
		gap: 8px;
	}

	.chip {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border: 2px solid var(--outline);
		border-radius: 8px;
		background: var(--window);
		color: var(--foreground);
		cursor: pointer;
		font-size: 15px;
		line-height: 1;
		transition: transform 0.15s ease;
	}

	.chip:hover {
		transform: translateY(-1px);
	}

	.skin-soft {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.skin-kawaii {
		font-size: 17px;
	}
</style>
