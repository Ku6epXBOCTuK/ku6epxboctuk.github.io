<script lang="ts">
	import Button from "./ui/Button.svelte";

	interface Props {
		title: string;
		body: string;
		confirmLabel?: string;
		disabled?: boolean;
		oncancel: () => void;
		onconfirm: () => void;
	}

	let {
		title,
		body,
		confirmLabel = "да, удалить",
		disabled = false,
		oncancel,
		onconfirm,
	}: Props = $props();

	const titleId = `confirm-${crypto.randomUUID()}`;

	function onkeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.stopPropagation();
			oncancel();
		}
	}
</script>

<div
	class="backdrop"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget) oncancel();
	}}
	{onkeydown}
>
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
		<h2 id={titleId}>{title}</h2>
		<p>{body}</p>
		<div class="actions">
			<Button onclick={oncancel}>отмена</Button>
			<Button variant="danger-solid" {disabled} onclick={onconfirm}
				>{confirmLabel}</Button
			>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: var(--gap-6);
		background: var(--backdrop);
	}

	.modal {
		width: min(var(--modal-w), 100%);
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
		padding: var(--gap-4);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-panel);
		background: var(--surface-2);
		box-shadow: var(--shadow-panel);
	}

	h2 {
		margin: 0;
		font-size: var(--fs-lg);
		font-weight: 700;
		color: var(--text);
	}

	p {
		margin: 0;
		font-size: var(--fs-md);
		line-height: var(--lh-copy);
		color: var(--text-dim);
	}

	.actions {
		display: flex;
		gap: var(--gap-2);
	}
</style>
