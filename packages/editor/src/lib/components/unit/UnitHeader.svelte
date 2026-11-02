<script lang="ts">
	import type { ContentType } from "@ku6epxboctuk/content-core/shared";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";

	interface Props {
		type: ContentType;
		slug: string;
		busy: boolean;
		ondelete: () => void;
	}

	let { type, slug, busy, ondelete }: Props = $props();

	let confirming = $state(false);
</script>

<header>
	<a class="back" href="/">← всё</a>
	<h1><span class="kind">{type}</span>{slug}</h1>
	<Button
		variant="danger"
		disabled={busy}
		onclick={() => (confirming = !confirming)}
	>
		удалить
	</Button>
</header>

{#if confirming}
	<div class="confirm">
		<span>Удалить <code>{type}/{slug}</code> вместе с обоими файлами?</span>
		<Button disabled={busy} onclick={ondelete}>да, удалить</Button>
		<Button onclick={() => (confirming = false)}>отмена</Button>
	</div>
{/if}

<style>
	header {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		flex-wrap: wrap;
	}

	header h1 {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: var(--ui-space-3);
		margin: 0;
		min-width: 0;
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-lg);
		font-weight: 600;
		color: var(--ui-fg);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kind {
		font-family: var(--ui-font);
		font-size: var(--ui-fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-fg-muted);
	}

	.back {
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-secondary);
		text-decoration: none;
	}

	.back:hover {
		color: var(--ui-fg);
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: var(--ui-space-4);
		flex-wrap: wrap;
		padding: var(--ui-space-4);
		border: 1px solid color-mix(in srgb, var(--ui-danger) 50%, var(--ui-line));
		border-radius: var(--ui-r-control);
		background: var(--ui-danger-surface);
		font-size: var(--ui-fs-lg);
	}

	.confirm code {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-md);
	}
</style>
