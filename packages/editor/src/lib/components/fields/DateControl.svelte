<script lang="ts">
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

	interface Props {
		id: string;
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, disabled = false, onchange }: Props = $props();
</script>

<TextInput
	{id}
	type="date"
	{disabled}
	{value}
	oninput={(e) => onchange(e.currentTarget.value)}
/>
