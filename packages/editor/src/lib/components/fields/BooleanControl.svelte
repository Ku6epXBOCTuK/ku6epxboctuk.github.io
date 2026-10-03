<script lang="ts">
	interface Props {
		id: string;
		value: unknown;
		disabled?: boolean;
		onchange: (value: boolean) => void;
	}

	let { id, value, disabled = false, onchange }: Props = $props();
</script>

<input
	{id}
	type="checkbox"
	{disabled}
	checked={value === true}
	onchange={(e) => onchange(e.currentTarget.checked)}
/>

<style>
	input {
		width: var(--check-size);
		height: var(--check-size);
		accent-color: var(--accent);
	}
</style>
