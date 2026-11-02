<script lang="ts">
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

	interface Props {
		id: string;
		value: string | number;
		disabled?: boolean;
		onchange: (value: number | undefined) => void;
	}

	let { id, value, disabled = false, onchange }: Props = $props();

	const shown = $derived(value === undefined ? "" : String(value));
</script>

<TextInput
	{id}
	type="number"
	{disabled}
	value={shown}
	oninput={(e) =>
		onchange(
			e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value),
		)}
/>
