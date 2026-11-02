<script lang="ts">
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import Modal from "@ku6epxboctuk/ui-kit/components/Modal";

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
</script>

<Modal open {title} dismissable onclose={oncancel}>
	<p>{body}</p>
	{#snippet actions()}
		<Button onclick={oncancel}>отмена</Button>
		<Button variant="danger" {disabled} onclick={onconfirm}>
			{confirmLabel}
		</Button>
	{/snippet}
</Modal>

<style>
	p {
		margin: 0;
		font-size: var(--fs-md);
		line-height: var(--lh-copy);
		color: var(--text-dim);
	}
</style>
