<script lang="ts">
	import type { ContentLang } from "@ku6epxboctuk/content-core/shared";
	import IconButton from "@ku6epxboctuk/ui-kit/components/IconButton";

	const LANG_LABEL: Record<ContentLang, string> = { ru: "RU", en: "EN" };

	interface Props {
		label: string;
		disabled?: boolean;
		oncopy: (from: ContentLang, to: ContentLang) => void;
	}

	let { label, disabled = false, oncopy }: Props = $props();
</script>

<div class="arrows">
	<IconButton
		size="sm"
		{disabled}
		label={`${label}: ${LANG_LABEL.ru} → ${LANG_LABEL.en}`}
		onclick={() => oncopy("ru", "en")}
	>
		→
	</IconButton>
	<IconButton
		size="sm"
		{disabled}
		label={`${label}: ${LANG_LABEL.en} → ${LANG_LABEL.ru}`}
		onclick={() => oncopy("en", "ru")}
	>
		←
	</IconButton>
</div>

<style>
	.arrows {
		display: flex;
		flex-direction: column;
		gap: var(--gap-half);
		padding-top: var(--cell-py);
		font-family: var(--ui-font-mono);
	}

	@media (width <= 1100px) {
		.arrows {
			flex-direction: row;
			justify-content: end;
			padding: 0 var(--ui-space-3) var(--ui-space-3);
		}
	}
</style>
