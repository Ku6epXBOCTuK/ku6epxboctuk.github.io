<script lang="ts">
	import type { ContentLang } from "@ku6epxboctuk/content-core/shared";

	/*
	 * Стрелки копирования одного поля между языками. Лежат в узкой средней
	 * колонке сетки, поэтому нажатие читается однозначно: вправо — RU в EN.
	 */

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };

	interface Props {
		/** Подпись поля для title кнопок. */
		label: string;
		disabled?: boolean;
		oncopy: (from: ContentLang, to: ContentLang) => void;
	}

	let { label, disabled = false, oncopy }: Props = $props();
</script>

<div class="arrows">
	<button
		type="button"
		{disabled}
		title={`${label}: ${LANG_LABEL.ru} → ${LANG_LABEL.en}`}
		onclick={() => oncopy("ru", "en")}>→</button
	>
	<button
		type="button"
		{disabled}
		title={`${label}: ${LANG_LABEL.en} → ${LANG_LABEL.ru}`}
		onclick={() => oncopy("en", "ru")}>←</button
	>
</div>

<style>
	.arrows {
		display: flex;
		flex-direction: column;
		gap: var(--gap-half);
		padding-top: var(--cell-py);
	}

	.arrows button {
		width: var(--arrow-w);
		height: var(--arrow-h);
		padding: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		line-height: 1;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.arrows button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.arrows button:hover:not(:disabled) {
		color: var(--accent);
		background: var(--surface-3);
		border-color: var(--accent-dim);
	}

	@media (width <= 1100px) {
		.arrows {
			flex-direction: row;
			justify-content: end;
			padding: 0 var(--gap-2) var(--gap-2);
		}
	}
</style>
