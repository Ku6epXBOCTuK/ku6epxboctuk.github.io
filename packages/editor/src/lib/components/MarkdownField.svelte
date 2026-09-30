<script lang="ts">
	interface Props {
		value: string;
		disabled?: boolean;
		needsMoreMarker?: boolean;
		onchange: (value: string) => void;
	}

	let {
		value,
		disabled = false,
		needsMoreMarker = false,
		onchange,
	}: Props = $props();

	const MARKER = "<!--more-->";

	const hasMarker = $derived(value.includes(MARKER));

	const teaserLength = $derived(hasMarker ? value.indexOf(MARKER) : 0);

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
		<div class="marker" class:missing={!hasMarker}>
			{#if hasMarker}
				<span>
					<strong>&lt;!--more--&gt;</strong> тизер — {teaserLength} символов до маркера.
					Всё до него — тизер.
				</span>
				<button type="button" {disabled} onclick={removeMarker}>убрать</button>
			{:else}
				<span>
					<strong>&lt;!--more--&gt;</strong> обязателен для статьи: до него тизер,
					после — текст.
				</span>
				<button type="button" {disabled} onclick={insertMarker}>вставить</button
				>
			{/if}
		</div>
	{/if}

	<textarea
		{disabled}
		rows="18"
		{value}
		oninput={(e) => onchange(e.currentTarget.value)}
	></textarea>

	<div class="foot">
		<span>{value.length} символов</span>
		<span
			>картинки вставляй абсолютным путём: <code>![alt](/images/x.webp)</code
			></span
		>
	</div>
</div>

<style>
	.markdown {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.marker {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		font-size: 12px;
		padding: 7px 9px;
		border: 1px solid #c9e3c9;
		border-radius: 5px;
		background: #f2faf2;
	}

	.marker.missing {
		border-color: #e0c0c0;
		background: #fdf3f3;
	}

	textarea {
		font-family: ui-monospace, monospace;
		font-size: 13px;
		line-height: 1.6;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
		resize: vertical;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 11px;
		color: #777;
	}

	code {
		font-size: 11px;
	}

	button {
		font: inherit;
		font-size: 11px;
		padding: 2px 8px;
		border: 1px solid #bbb;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
	}
</style>
