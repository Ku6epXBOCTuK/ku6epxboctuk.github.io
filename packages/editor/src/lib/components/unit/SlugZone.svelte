<script lang="ts">
	import { isValidSlug } from "@ku6epxboctuk/content-core/shared";
	import Button from "../ui/Button.svelte";
	import TextInput from "../ui/TextInput.svelte";

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
			oninput={onchange}
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
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		padding: var(--gap-3);
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
		background: var(--surface);
	}

	.slug-zone h2 {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--text-faint);
	}

	.slug-zone p {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--text-dim);
	}

	.row {
		display: flex;
		gap: var(--gap-2);
		flex-wrap: wrap;
	}

	.row :global(input) {
		flex: 1;
		min-width: var(--input-min-w);
	}

	.bad {
		color: var(--danger);
	}
</style>
