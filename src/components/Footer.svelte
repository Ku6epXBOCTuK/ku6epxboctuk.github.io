<footer class="footer">
	built with vscode and couple cups of tea <span class="blink">_</span><br /><br
	/>
	<a href="https://github.com/Ku6epXBOCTuK" target="_blank">github</a> ·
	<a href="https://t.me/Ku6epXBOCTuK_feed" target="_blank">telegram</a> ·
	<a href="https://www.twitch.tv/Ku6ep_XBOCTuK" target="_blank">twitch</a> ·
	<a href="https://Ku6epXBOCTuK.github.io" target="_blank">this site</a> ·
	<a href="mailto:Ku6epXBOCTuK@gmail.com">email</a>
</footer>

<div class="status-bar">
	<span><span class="mode">NORMAL</span></span>
	<span>utf-8 · svelte</span>
</div>

<style>
	.footer {
		margin-top: 80px;
		padding: 20px 0 40px;
		border-top: 1px solid var(--outline);
		text-align: center;
		color: var(--muted-foreground);
		font-size: 12px;
	}

	.footer a {
		color: var(--periwinkle);
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	.blink {
		animation: blink 1s step-end infinite;
		color: var(--coral);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.status-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 4px 24px;
		border-top: 1px solid var(--outline);
		background: var(--background);
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--muted-foreground);
		z-index: 100;
	}

	.status-bar .mode {
		color: var(--background);
		background: var(--coral);
		padding: 1px 8px;
	}
</style>
