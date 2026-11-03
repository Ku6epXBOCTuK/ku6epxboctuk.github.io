<script lang="ts">
	import FileDrop from "@ku6epxboctuk/ui-kit/components/FileDrop.svelte";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice.svelte";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput.svelte";
	import { describeSize, uploadImage } from "$lib/upload";

	interface Props {
		value: string;
		id?: string;
		disabled?: boolean;
		slug?: string;
		onchange: (value: string) => void;
	}

	let {
		value,
		id = "image",
		disabled = false,
		slug = "",
		onchange,
	}: Props = $props();

	let busy = $state(false);
	let error = $state("");
	let saved = $state<{ width: number; height: number; bytes: number } | null>(
		null,
	);

	async function pick(file: File) {
		busy = true;
		error = "";
		try {
			const result = await uploadImage({
				file,
				kind: "banner",
				slug,
				replace: value,
			});
			saved = {
				width: result.width,
				height: result.height,
				bytes: result.bytes,
			};
			onchange(result.path);
		} catch (err) {
			error = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<div class="image">
	<FileDrop
		{disabled}
		accept="image/*"
		label={busy ? "обрабатываю…" : "перетащи картинку или нажми"}
		onpick={pick}
	/>

	{#if value}
		<img src={value} alt="предпросмотр обложки" />
	{/if}

	<TextInput
		{id}
		{disabled}
		{value}
		mono
		placeholder="/images/oblozhka.webp"
		oninput={(e) => onchange(e.currentTarget.value)}
	/>

	{#if error}
		<Notice tone="danger" size="lg">{error}</Notice>
	{:else if saved}
		<Notice>
			{saved.width}×{saved.height}
			· {describeSize(saved.bytes)}
		</Notice>
	{/if}
</div>

<style>
	.image {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-3);
	}

	img {
		max-width: 100%;
		max-height: var(--img-preview-h);
		object-fit: contain;
		background: var(--ui-bg);
		border: 1px solid var(--ui-line-strong);
		border-radius: var(--ui-r-control);
	}
</style>
