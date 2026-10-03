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
		gap: var(--gap-2);
		min-height: var(--drop-min-h);
		padding: var(--gap-2);
		font-size: var(--fs-sm);
		color: var(--text-faint);
		text-align: center;
		border: 1px dashed var(--line-strong);
		border-radius: var(--r-control);
		background: var(--bg);
		cursor: pointer;
	}

	.drop:hover:not(.disabled) {
		border-color: var(--accent-dim);
		color: var(--text-dim);
	}

	.drop.over {
		border-color: var(--accent);
		border-style: solid;
		background: var(--accent-wash);
		color: var(--accent);
	}

	.drop.disabled {
		opacity: 0.5;
		cursor: default;
	}

	input {
		display: none;
	}
</style>
