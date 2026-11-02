<script lang="ts">
	import { describeSize, uploadImage } from "$lib/upload";
	import ImageDrop from "./ImageDrop.svelte";

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
	<ImageDrop
		{disabled}
		label={busy ? "обрабатываю…" : "перетащи картинку или нажми"}
		onpick={pick}
	/>

	{#if value}
		<img src={value} alt="предпросмотр обложки" />
	{/if}

	<input
		{id}
		type="text"
		{disabled}
		{value}
		placeholder="/images/oblozhka.webp"
		oninput={(e) => onchange(e.currentTarget.value)}
	/>

	{#if error}
		<span class="bad">{error}</span>
	{:else if saved}
		<span class="note">
			{saved.width}×{saved.height} · {describeSize(saved.bytes)}
		</span>
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

	input {
		font: inherit;
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-lg);
		padding: var(--pad-field);
		color: var(--ui-fg);
		background: var(--ui-bg);
		border: 1px solid var(--ui-line-strong);
		border-radius: var(--ui-r-control);
	}

	input:focus {
		outline: none;
		border-color: var(--ui-accent-ink);
	}

	input:hover:not(:disabled):not(:focus) {
		border-color: var(--ui-line-strong);
	}

	.note {
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
	}

	.bad {
		font-size: var(--ui-fs-lg);
		color: var(--ui-danger);
	}
</style>
