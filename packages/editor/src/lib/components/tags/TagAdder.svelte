<script lang="ts">
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

	interface Props {
		value: string;
		busy: boolean;
		error: string | null;
		oninput: (next: string) => void;
		onadd: () => void;
	}

	let { value, busy, error, oninput, onadd }: Props = $props();
</script>

<div class="adder">
	<TextInput
		{value}
		placeholder="новый тег"
		aria-label="новый тег"
		invalid={Boolean(error)}
		oninput={(e) => oninput(e.currentTarget.value)}
		onkeydown={(e) => {
			if (e.key === "Enter") onadd();
		}}
	/>
	<Button disabled={busy || !value || Boolean(error)} onclick={onadd}>
		добавить в список
	</Button>
	{#if error}
		<Notice tone="danger">{error}</Notice>
	{/if}
</div>

<style>
	.adder {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		flex-wrap: wrap;
	}

	.adder :global(input) {
		min-width: var(--input-min-w);
	}
</style>
