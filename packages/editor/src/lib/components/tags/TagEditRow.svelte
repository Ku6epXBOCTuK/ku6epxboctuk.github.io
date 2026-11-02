<script lang="ts">
	import type { TagPlan } from "$lib/types";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";

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
		oninput={(e) => ondraft(e.currentTarget.value)}
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
		<Notice tone="danger">{error}</Notice>
	{:else if plan?.merge}
		<Notice tone="warning">
			тег «{plan.to}» уже есть — сольются, останется в
			{plan.resultCount}
			{plan.resultCount === 1 ? "записи" : "записях"}
			{#if plan.duplicates > 0}
				, из них {plan.duplicates} с дублями
			{/if}
		</Notice>
	{/if}
</div>

<style>
	.edit-row {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		flex: 1;
		flex-wrap: wrap;
	}

	.edit-row :global(input) {
		max-width: 220px;
	}
</style>
