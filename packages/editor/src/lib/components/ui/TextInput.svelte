<script lang="ts">
	interface Props {
		id?: string;
		value?: string;
		type?: "text" | "url";
		placeholder?: string;
		disabled?: boolean;
		mono?: boolean;
		invalid?: boolean;
		"aria-label"?: string;
		input?: HTMLInputElement | null;
		oninput?: (value: string) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		id,
		value = $bindable(""),
		type = "text",
		placeholder,
		disabled = false,
		mono = false,
		invalid = false,
		input = $bindable(null),
		oninput,
		onkeydown,
		...rest
	}: Props = $props();
</script>

<input
	{id}
	{type}
	class:mono
	bind:this={input}
	{disabled}
	{value}
	{placeholder}
	aria-invalid={invalid || undefined}
	{...rest}
	oninput={(e) => oninput?.(e.currentTarget.value)}
	{onkeydown}
/>

<style>
	input {
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--pad-field);
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.mono {
		font-family: var(--font-mono);
	}

	input::placeholder {
		color: var(--text-faint);
	}

	input:disabled {
		background: var(--surface);
		color: var(--text-faint);
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
	}

	input:hover:not(:disabled):not(:focus) {
		border-color: var(--line-hover);
	}

	input[aria-invalid="true"] {
		border-color: var(--danger);
	}
</style>
