<script lang="ts">
	interface Props {
		disabled?: boolean;
		label: string;
		onpick: (file: File) => void;
	}

	let { disabled = false, label, onpick }: Props = $props();

	let over = $state(false);
	let input: HTMLInputElement | undefined = $state();

	function accept(file: File | undefined) {
		if (!file || !file.type.startsWith("image/")) return;
		onpick(file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		over = false;
		accept(event.dataTransfer?.files?.[0]);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			input?.click();
		}
	}
</script>

<div
	class="drop"
	class:over
	class:disabled
	role="button"
	tabindex={disabled ? undefined : 0}
	aria-disabled={disabled}
	onclick={() => !disabled && input?.click()}
	onkeydown={onKeyDown}
	ondragover={(e) => {
		e.preventDefault();
		if (!disabled) over = true;
	}}
	ondragleave={() => (over = false)}
	ondrop={onDrop}
>
	{label}
	<input
		bind:this={input}
		type="file"
		accept="image/*"
		{disabled}
		onchange={(e) => {
			accept(e.currentTarget.files?.[0]);
			e.currentTarget.value = "";
		}}
	/>
</div>

<style>
	.drop {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--ui-space-3);
		min-height: var(--drop-min-h);
		padding: var(--ui-space-3);
		font-size: var(--ui-fs-md);
		color: var(--ui-fg-muted);
		text-align: center;
		border: 1px dashed var(--ui-line-strong);
		border-radius: var(--ui-r-control);
		background: var(--ui-bg);
		cursor: pointer;
	}

	.drop:hover:not(.disabled) {
		border-color: var(--ui-accent);
		color: var(--ui-fg-secondary);
	}

	.drop.over {
		border-color: var(--ui-accent-ink);
		border-style: solid;
		background: var(--ui-accent-surface);
		color: var(--ui-accent-ink);
	}

	.drop.disabled {
		opacity: 0.5;
		cursor: default;
	}

	input {
		display: none;
	}
</style>
