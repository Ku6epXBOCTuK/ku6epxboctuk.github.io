<footer class="footer">
	<a class="brand" href="/">
		<span class="brand-mark" aria-hidden="true">✦</span>
		<span>xboct<span class="brand-dot">.</span>dev</span>
	</a>
	<p class="footer-note">built with attention to detail</p>
	<span class="footer-code">© 2026 / system.online</span>
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

	@media (max-width: 700px) {
		.footer {
			width: calc(100% - 28px);
			flex-direction: column;
			align-items: flex-start;
			gap: 18px;
		}
	}
</style>
