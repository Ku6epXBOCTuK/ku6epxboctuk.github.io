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

	<!-- Подсказку про 1200×630 и static/images показывает Field из fields.ts,
	     здесь она была бы второй копией того же текста. -->
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
		gap: var(--gap-2);
	}

	img {
		max-width: 100%;
		max-height: 180px;
		object-fit: contain;
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	input {
		font: inherit;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		padding: 6px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.note {
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.bad {
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
