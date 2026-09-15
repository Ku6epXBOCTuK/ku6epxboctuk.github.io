<script lang="ts">
	import { page } from "$app/state";
	import { pageLang } from "$lib/content";

	const lang = $derived(pageLang(page.data.lang));
	const other = $derived(lang === "ru" ? "en" : "ru");

	const rest = $derived(page.url.pathname.replace(/^\/(ru|en)(\/|$)/, "/"));
	const href = $derived(`/${other}${rest === "/" ? "" : rest}`);
	const label = $derived(other === "en" ? "EN" : "RU");
	const title = $derived(other === "en" ? "English" : "Русский");
</script>

<a class="chip" {href} hreflang={other} {title} aria-label={title}>
	{label}
</a>

<style>
	.chip {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border: 2px solid var(--outline);
		border-radius: 8px;
		background: var(--window);
		color: var(--foreground);
		text-decoration: none;
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1;
		transition: transform 0.15s ease;
	}

	.chip:hover {
		transform: translateY(-1px);
	}

	:global([data-skin="soft"]) .chip {
		border-width: 1px;
	}
</style>
