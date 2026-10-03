<script lang="ts">
	import type { TagPlan } from "$lib/types";
	import Button from "../ui/Button.svelte";
	import TextInput from "../ui/TextInput.svelte";

	interface Props {
		draft: string;
		error: string | null;
		plan: TagPlan | null;
		busy: boolean;
		ondraft: (next: string) => void;
		oncommit: () => void;
		oncancel: () => void;
	}

	let { draft, error, plan, busy, ondraft, oncommit, oncancel }: Props =
		$props();
</script>

<div class="edit-row">
	<TextInput
		value={draft}
		invalid={Boolean(error)}
		oninput={ondraft}
		onkeydown={(e) => {
			if (e.key === "Enter") oncommit();
			if (e.key === "Escape") oncancel();
		}}
	/>
	<Button disabled={busy} onclick={oncommit}>
		{plan?.merge ? "слить" : "ок"}
	</Button>
	<Button disabled={busy} onclick={oncancel}>отмена</Button>
	{#if error}
		<span class="note bad">{error}</span>
	{:else if plan?.merge}
		<span class="note">
			тег «{plan.to}» уже есть — сольются, останется в
			{plan.resultCount}
			{plan.resultCount === 1 ? "записи" : "записях"}
			{#if plan.duplicates > 0}
				, из них {plan.duplicates} с дублями
			{/if}
		</span>
	{/if}
</div>

<style>
	.edit-row {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex: 1;
		flex-wrap: wrap;
	}

	.edit-row :global(input) {
		max-width: 220px;
	}

	.note {
		font-size: var(--fs-sm);
		color: var(--warn);
	}

	.note.bad {
		color: var(--danger);
	}
</style>
