<script lang="ts">
	import { isValidSlug } from "@ku6epxboctuk/content-core/shared";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

	interface Props {
		renameFrom: string;
		value: string;
		busy: boolean;
		onsuggest: () => void;
		onrename: () => void;
		onchange: (next: string) => void;
	}

	let { renameFrom, value, busy, onsuggest, onrename, onchange }: Props =
		$props();

	const slugOk = $derived(isValidSlug(value));
	const renameChanged = $derived(value !== renameFrom && slugOk);
</script>

<section class="slug-zone">
	<h2>Slug</h2>
	<p>
		Переименование меняет адрес на сайте: старые ссылки перестанут работать.
	</p>
	<div class="row">
		<TextInput
			mono
			{value}
			invalid={!slugOk}
			placeholder="my-slug"
			oninput={(e) => onchange(e.currentTarget.value)}
		/>
		<Button onclick={onsuggest}>из заголовка</Button>
		<Button disabled={!renameChanged || busy} onclick={onrename}>
			переименовать
		</Button>
	</div>
	{#if value && !slugOk}
		<p class="bad">Только a-z0-9 и дефисы, без пробелов и подчёркиваний.</p>
	{/if}
</section>

<style>
	.slug-zone {
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-panel);
		padding: var(--ui-space-4);
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-3);
		background: var(--ui-surface);
	}

	.slug-zone h2 {
		margin: 0;
		font-size: var(--ui-fs-md);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-fg-muted);
	}

	.slug-zone p {
		margin: 0;
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-secondary);
	}

	.row {
		display: flex;
		gap: var(--ui-space-3);
		flex-wrap: wrap;
	}

	.row :global(input) {
		flex: 1;
		min-width: var(--input-min-w);
	}

	.bad {
		color: var(--ui-danger);
	}
</style>
