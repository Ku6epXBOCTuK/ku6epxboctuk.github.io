<script lang="ts">
	import { uploadImage } from "$lib/upload";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import TextArea from "@ku6epxboctuk/ui-kit/components/TextArea";
	import FileDrop from "@ku6epxboctuk/ui-kit/components/FileDrop";
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
	const ROWS = 10;

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

	<TextArea
		{disabled}
		rows={ROWS}
		mono
		class="md-input"
		{value}
		oninput={(e) => onchange(e.currentTarget.value)}
	/>

	<FileDrop
		{disabled}
		accept="image/*"
		label={uploading ? "загружаю…" : "перетащи картинку в текст"}
		onpick={insertImage}
	/>

	<div class="foot">
		<span>{value.length} символов</span>
	</div>

	{#if uploadError}
		<Notice tone="danger" size="lg">{uploadError}</Notice>
	{/if}
</div>

<style>
	.markdown {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-3);
	}

	:global(.md-input) {
		min-height: var(--textarea-min-h);
		font-size: var(--ui-fs-lg);
		tab-size: 2;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: var(--ui-space-4);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
	}
</style>
