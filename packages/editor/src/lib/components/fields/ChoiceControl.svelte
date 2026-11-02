<script lang="ts">
	import Select from "@ku6epxboctuk/ui-kit/components/Select";
	import { createSelect } from "@ku6epxboctuk/ui-kit/headless/select";

	interface Props {
		id: string;
		value: string;
		choices: readonly string[];
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, choices, disabled = false, onchange }: Props = $props();

	const options = $derived<string[]>(["", ...choices]);

	const label = $derived(value === "" ? "—" : value);

	const picker = createSelect<string>({
		items: () => options,
		getLabel: (option: string) => (option === "" ? "—" : option),
		onPick: (option: string) => onchange(option),
	});
</script>

<Select
	select={picker}
	getKey={(option: string) => option}
	isSelected={(option: string) => option === value}
	variant="field"
	listLabel="варианты"
>
	{#snippet trigger()}
		<button
			{id}
			type="button"
			class="ui-select-trigger"
			{disabled}
			aria-haspopup="listbox"
			aria-expanded={picker.open}
			onclick={() => picker.toggle()}
		>
			<span class="ui-select-trigger-label">{label}</span>
			<span class="ui-select-trigger-caret" aria-hidden="true">▾</span>
		</button>
	{/snippet}
	{#snippet option(option)}
		<span class="ui-select-option-label" data-empty={option === ""}>
			{option === "" ? "—" : option}
		</span>
	{/snippet}
</Select>

<style>
	.ui-select-trigger {
		font-family: var(--font-mono);
	}

	.ui-select-option-label[data-empty] {
		color: var(--text-faint);
	}
</style>
