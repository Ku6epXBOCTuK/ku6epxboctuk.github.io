<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import {
		defaultsFor,
		draftSlug,
		entryFromFlat,
		type ContentType,
		type EntrySummary,
	} from "@ku6epxboctuk/content-core/shared";
	import Button from "../ui/Button.svelte";
	import GithubCreate from "./GithubCreate.svelte";
	import UnitGroup from "./UnitGroup.svelte";

	interface Props {
		type: ContentType;
	}

	let { type }: Props = $props();

	const TYPE_LABEL: Record<ContentType, string> = {
		post: "посты",
		article: "статьи",
		project: "проекты",
	};

	const NEW_LABEL: Record<ContentType, string> = {
		post: "новый пост",
		article: "новая статья",
		project: "новый проект",
	};

	const units = $derived(
		(page.data.units as EntrySummary[]).filter((unit) => unit.type === type),
	);

	let creating = $state(false);
	let errorText = $state("");

	async function createPlain() {
		const slug = draftSlug(type);
		creating = true;
		errorText = "";
		try {
			const res = await fetch(`/api/entries/${type}/${slug}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(entryFromFlat(type, slug, defaultsFor(type))),
			});
			if (!res.ok) {
				errorText =
					((await res.json().catch(() => ({}))) as { error?: string }).error ??
					`HTTP ${res.status}`;
				return;
			}
			await goto(`/${type}/${slug}`);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}
</script>

<section class="type-page">
	<header>
		<h1>{TYPE_LABEL[type]}</h1>
		<Button variant="primary" disabled={creating} onclick={createPlain}>
			{NEW_LABEL[type]}
		</Button>
		{#if type === "project"}
			<GithubCreate />
		{/if}
	</header>

	{#if errorText}
		<p class="bad">{errorText}</p>
	{/if}

	{#if units.length === 0}
		<p class="empty">Пока пусто — создай первую кнопкой выше.</p>
	{:else}
		<UnitGroup {units} />
	{/if}
</section>

<style>
	.type-page {
		display: flex;
		flex-direction: column;
		gap: var(--gap-3);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--gap-3);
		flex-wrap: wrap;
	}

	header h1 {
		margin: 0;
		font-size: var(--fs-xl);
		font-weight: 600;
		letter-spacing: var(--track-tight);
	}

	.empty {
		margin: var(--gap-6) 0;
		font-size: var(--fs-md);
		color: var(--text-faint);
	}

	.bad {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
