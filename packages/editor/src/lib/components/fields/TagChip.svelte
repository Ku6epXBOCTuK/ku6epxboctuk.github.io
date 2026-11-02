<script lang="ts">
	import Chip from "@ku6epxboctuk/ui-kit/components/Chip";

	interface Props {
		tag: string;
		copied?: boolean;
		dragging?: boolean;
		disabled?: boolean;
		oncopy: (tag: string) => void;
		onremove: (tag: string) => void;
		ondragstart: (event: DragEvent) => void;
		ondrop: (event: DragEvent) => void;
		ondragend: () => void;
	}

	let {
		tag,
		copied = false,
		dragging = false,
		disabled = false,
		oncopy,
		onremove,
		ondragstart,
		ondrop,
		ondragend,
	}: Props = $props();
</script>

<li
	class:dragging
	draggable={disabled ? "false" : "true"}
	{ondragstart}
	ondragover={(e) => e.preventDefault()}
	{ondrop}
	{ondragend}
>
	<Chip
		onopen={disabled ? undefined : () => oncopy(tag)}
		openLabel={`скопировать тег ${tag}`}
		onremove={disabled ? undefined : () => onremove(tag)}
		removeLabel={`убрать тег ${tag}`}
		unavailable={disabled}
	>
		{copied ? "скопировано" : tag}
	</Chip>
</li>

<style>
	li.dragging {
		opacity: 0.4;
	}
</style>
