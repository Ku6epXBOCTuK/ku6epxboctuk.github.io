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

	<span class="note">
		Обложка приводится к 1200×630 и кладётся в <code>static/images</code>. При
		загрузке новой старая удаляется. Путь можно вписать вручную.
	</span>

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
		gap: 6px;
	}

	img {
		max-width: 100%;
		max-height: 180px;
		object-fit: contain;
		border: 1px solid #ddd;
		border-radius: 5px;
	}

	input {
		font: inherit;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.note {
		font-size: 11px;
		color: #777;
	}

	.bad {
		font-size: 12px;
		color: #b00020;
	}
</style>
