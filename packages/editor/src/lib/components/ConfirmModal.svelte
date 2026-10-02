<script lang="ts">
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

<!--
	Свой диалог, а не `confirm()`: браузерный алерт не даёт ни оформления под
	тему, ни управления фокусом, и выглядит как ошибка на чужом сайте.
	Роль dialog + aria-modal помечают его как модальный для скринридера, а сама
	разметка ловит клик по подложке и Escape.
-->
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
			<button type="button" onclick={oncancel}>отмена</button>
			<button type="button" class="danger" {disabled} onclick={onconfirm}
				>{confirmLabel}</button
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
		background: rgb(0 0 0 / 62%);
	}

	.modal {
		width: min(560px, 100%);
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
		padding: var(--gap-5);
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
		line-height: 1.6;
		color: var(--text-dim);
	}

	.actions {
		display: flex;
		gap: var(--gap-2);
	}

	.actions button {
		font: inherit;
		font-size: var(--fs-md);
		padding: 7px 14px;
		color: var(--text-dim);
		background: var(--surface-3);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.actions button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.actions button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface);
	}

	.actions button.danger {
		color: var(--on-danger);
		background: var(--danger-strong);
		border-color: var(--danger-strong);
		font-weight: 600;
	}

	.actions button.danger:hover:not(:disabled) {
		background: var(--danger);
		border-color: var(--danger);
	}
</style>
