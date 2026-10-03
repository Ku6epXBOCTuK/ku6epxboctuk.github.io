<script lang="ts">
	import { uploadImage } from "$lib/upload";
	import ImageDrop from "./ImageDrop.svelte";
	import MoreMarker from "./MoreMarker.svelte";

	interface Props {
		value: string;
		disabled?: boolean;
		slug?: string;
		needsMoreMarker?: boolean;
		onchange: (value: string) => void;
	}

	let {
		value,
		disabled = false,
		slug = "",
		needsMoreMarker = false,
		onchange,
	}: Props = $props();

	const MARKER = "<!--more-->";

	let uploading = $state(false);
	let uploadError = $state("");

	const hasMarker = $derived(value.includes(MARKER));

	const teaserLength = $derived(hasMarker ? value.indexOf(MARKER) : 0);

	async function insertImage(file: File) {
		uploading = true;
		uploadError = "";
		try {
			const saved = await uploadImage({ file, kind: "content", slug });
			const alt = file.name.replace(/\.[^.]+$/, "");
			const base = value.trimEnd();
			onchange(`${base}${base ? "\n\n" : ""}![${alt}](${saved.path})\n`);
		} catch (err) {
			uploadError = (err as Error).message;
		} finally {
			uploading = false;
		}
	}

	function insertMarker() {
		const base = value.trimEnd();
		const next = base ? `${base}\n\n${MARKER}\n\n` : `${MARKER}\n\n`;
		onchange(next);
	}

	function removeMarker() {
		onchange(
			value
				.replaceAll(MARKER, "")
				.replace(/\n{3,}/g, "\n\n")
				.trimEnd(),
		);
	}
</script>

<div class="markdown">
	{#if needsMoreMarker}
		<MoreMarker
			{hasMarker}
			{teaserLength}
			{disabled}
			oninsert={insertMarker}
			onremove={removeMarker}
		/>
	{/if}

	<textarea
		{disabled}
		rows="10"
		{value}
		oninput={(e) => onchange(e.currentTarget.value)}
	></textarea>

	<ImageDrop
		{disabled}
		label={uploading ? "загружаю…" : "перетащи картинку в текст"}
		onpick={insertImage}
	/>

	<div class="foot">
		<span>{value.length} символов</span>
	</div>

	{#if uploadError}
		<span class="bad">{uploadError}</span>
	{/if}
</div>

<style>
	.markdown {
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
	}

	textarea {
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		line-height: var(--lh-code);
		min-height: var(--textarea-min-h);
		padding: var(--gap-4);
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		resize: vertical;
		tab-size: 2;
	}

	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: var(--gap-3);
		font-size: var(--fs-sm);
		color: var(--text-faint);
	}

	.bad {
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
