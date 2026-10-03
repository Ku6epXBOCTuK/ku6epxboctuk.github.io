<script lang="ts">
	import TextInput from "../ui/TextInput.svelte";

	interface Props {
		id: string;
		value: string;
		disabled?: boolean;
		kind?: "string" | "url";
		/** slug, path и repo — это данные, а не проза: показываем моноширинным. */
		mono?: boolean;
		onchange: (value: string) => void;
	}

	let {
		id,
		value,
		disabled = false,
		kind = "string",
		mono = false,
		onchange,
	}: Props = $props();
</script>

<TextInput
	{id}
	type={kind === "url" ? "url" : "text"}
	{disabled}
	{mono}
	{value}
	oninput={onchange}
/>
