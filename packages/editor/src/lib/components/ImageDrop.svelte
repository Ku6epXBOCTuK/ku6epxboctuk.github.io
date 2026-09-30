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
		gap: 8px;
		min-height: 52px;
		padding: 10px;
		font-size: 12px;
		color: #666;
		text-align: center;
		border: 1px dashed #bbb;
		border-radius: 6px;
		background: #fafafa;
		cursor: pointer;
	}

	.drop.over {
		border-color: #4a90d9;
		background: #eef5fd;
		color: #245c94;
	}

	.drop.disabled {
		opacity: 0.5;
		cursor: default;
	}

	input {
		display: none;
	}
</style>
