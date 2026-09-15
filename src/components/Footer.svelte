<script lang="ts">
	import { page } from "$app/state";
	import { DONATE } from "$lib/config";
	import { langUrl, pageLang } from "$lib/content";
	import { ui } from "$lib/i18n";

	const lang = $derived(pageLang(page.data.lang));
	const t = $derived(ui(lang));
</script>

<footer class="footer">
	<a class="brand" href={langUrl(lang, "/")}>
		<span class="brand-mark" aria-hidden="true">✦</span>
		<span>xboct<span class="brand-dot">.</span>dev</span>
	</a>
	<p class="footer-note">{t.footer.note}</p>
	<div class="footer-donate">
		<a
			class="donate-chip"
			href={DONATE.dalink}
			target="_blank"
			rel="noreferrer"
		>
			dalink <span class="donate-heart">♥</span>
		</a>
		<a
			class="donate-chip"
			href={DONATE.cloudtips}
			target="_blank"
			rel="noreferrer"
		>
			cloudtips <span class="donate-heart">♥</span>
		</a>
	</div>
	<span class="footer-code">{t.footer.code}</span>
</footer>

<style>
	.footer {
		width: min(1120px, calc(100% - 40px));
		margin: 0 auto;
		padding: 35px 0 45px;
		border-top: 1px solid var(--line);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		color: var(--muted-foreground);
		font-size: 12px;
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

	.footer-note {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.footer-code {
		font-family: var(--font-body);
	}

	.footer-donate {
		display: flex;
		gap: 8px;
	}

	.donate-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-display);
		font-size: 11px;
		font-weight: 700;
		padding: 5px 12px;
		border: 2px solid var(--outline);
		border-radius: 8px;
		color: var(--muted-foreground);
		text-decoration: none;
		transition: transform 0.15s ease;
	}

	.donate-chip:hover {
		transform: translateY(-1px);
		color: var(--foreground);
	}

	.donate-heart {
		color: var(--coral);
	}

	:global([data-skin="soft"]) .donate-chip {
		border-width: 1px;
		border-radius: 12px;
	}

	@media (max-width: 700px) {
		.footer {
			width: calc(100% - 28px);
			flex-direction: column;
			align-items: flex-start;
			gap: 18px;
		}
	}
</style>
