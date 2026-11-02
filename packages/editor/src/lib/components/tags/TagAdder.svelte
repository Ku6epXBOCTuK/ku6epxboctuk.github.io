<script lang="ts">
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
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
		<span class="note bad">{error}</span>
	{/if}
</div>

<style>
	.adder {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-wrap: wrap;
	}

	.adder :global(input) {
		min-width: var(--input-min-w);
	}

	.note {
		font-size: var(--fs-sm);
		color: var(--warn);
	}

	.note.bad {
		color: var(--danger);
	}
</style>
