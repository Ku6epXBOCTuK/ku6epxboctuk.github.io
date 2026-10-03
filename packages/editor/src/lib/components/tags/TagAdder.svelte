<script lang="ts">
	import Button from "../ui/Button.svelte";
	import TextInput from "../ui/TextInput.svelte";

	/*
	 * Завести тег заранее, до первого поста с ним.
	 *
	 * Инпут не глушится на время запроса (задизейбленный элемент теряет фокус,
	 * и следующий тег подряд не ввести), поэтому `disabled` здесь только на
	 * кнопке, а повторный Enter отсекает страница.
	 */

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
		{oninput}
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
