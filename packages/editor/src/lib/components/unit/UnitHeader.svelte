<script lang="ts">
	import type { ContentType } from "@ku6epxboctuk/content-core/shared";
	import Button from "../ui/Button.svelte";

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
		gap: var(--gap-3);
		flex-wrap: wrap;
	}

	header h1 {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: var(--gap-2);
		margin: 0;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kind {
		font-family: var(--font-ui);
		font-size: var(--fs-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--text-faint);
	}

	.back {
		font-size: var(--fs-md);
		color: var(--text-dim);
		text-decoration: none;
	}

	.back:hover {
		color: var(--text);
	}

	.confirm {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
		padding: var(--gap-3);
		border: 1px solid var(--line-danger);
		border-radius: var(--r-control);
		background: var(--danger-wash);
		font-size: var(--fs-md);
	}

	.confirm code {
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}
</style>
