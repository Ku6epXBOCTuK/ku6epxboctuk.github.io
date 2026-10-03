<script lang="ts">
	import { page } from "$app/state";
	import {
		CONTENT_TYPES,
		type ContentType,
		type EntrySummary,
	} from "@ku6epxboctuk/content-core/shared";
	import UnitGroup from "$lib/components/units/UnitGroup.svelte";

	const units = $derived(page.data.units as EntrySummary[]);

	const TYPE_LABEL: Record<ContentType, string> = {
		post: "посты",
		article: "статьи",
		project: "проекты",
	};
</script>

{#if units.length === 0}
	<p class="empty">Пока пусто. Создай первую единицу на странице типа.</p>
{:else}
	{#each CONTENT_TYPES as type (type)}
		{@const group = units.filter((unit) => unit.type === type)}
		{#if group.length > 0}
			<UnitGroup label={TYPE_LABEL[type]} units={group} />
		{/if}
	{/each}
{/if}

<style>
	.empty {
		margin: var(--gap-6) 0;
		font-size: var(--fs-md);
		color: var(--text-faint);
	}
</style>
