<script lang="ts">
	import type { EntrySummary } from "@ku6epxboctuk/content-core/shared";
	import Badge from "@ku6epxboctuk/ui-kit/components/Badge.svelte";
	import Button from "@ku6epxboctuk/ui-kit/components/Button.svelte";
	import ConfirmDialog from "@ku6epxboctuk/ui-kit/components/ConfirmDialog.svelte";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice.svelte";
	import SectionTitle from "@ku6epxboctuk/ui-kit/components/SectionTitle.svelte";
	import { invalidateAll } from "$app/navigation";

	interface Props {
		units: EntrySummary[];
		label?: string;
	}

	let { units, label }: Props = $props();

	let removing = $state<EntrySummary | null>(null);
	let busy = $state(false);
	let errorText = $state("");

	async function doDelete() {
		const unit = removing;
		if (!unit) return;

		busy = true;
		errorText = "";
		try {
			const res = await fetch(`/api/entries/${unit.type}/${unit.slug}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				errorText =
					((await res.json().catch(() => ({}))) as { error?: string }).error ??
					`HTTP ${res.status}`;
				return;
			}
			removing = null;
			await invalidateAll();
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

{#if label}
	<SectionTitle class="group-title">
		{label}
		<Badge>{units.length}</Badge>
	</SectionTitle>
{/if}

{#if errorText}
	<Notice tone="danger" size="lg" class="group-error">{errorText}</Notice>
{/if}

<ul>
	{#each units as unit (unit.slug)}
		<li>
			<a href="/{unit.type}/{unit.slug}">
				<span class="slug">{unit.slug}</span>
				<span class="title">{unit.title}</span>
			</a>
			<span class="flags">
				{#if unit.draft}
					<Badge>черновик</Badge>
				{/if}
				{#if unit.needsTranslation}
					<Badge tone="warning">перевод</Badge>
				{/if}
				<span class="langs">{unit.langs.join(" ")}</span>
				<Button
					variant="danger"
					size="sm"
					disabled={busy}
					onclick={() => (removing = unit)}
					>удалить</Button
				>
			</span>
		</li>
	{/each}
</ul>

{#if removing}
	<ConfirmDialog
		title="Удалить единицу?"
		body={`${removing.type}/${removing.slug} исчезнет вместе с обоими файлами. Отменить это нельзя.`}
		confirmLabel="да, удалить"
		disabled={busy}
		oncancel={() => (removing = null)}
		onconfirm={doDelete}
	/>
{/if}

<style>
	:global(.group-title) {
		margin: var(--ui-space-6) 0 var(--ui-space-3);
	}

	:global(.group-title) :global(.badge) {
		letter-spacing: 0;
	}

	:global(.group-error) {
		margin: var(--ui-space-3) 0;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-panel);
		overflow: hidden;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ui-space-4);
		padding: var(--pad-row);
		border-bottom: 1px solid var(--ui-line);
	}

	li:last-child {
		border-bottom: none;
	}

	li:hover {
		background: var(--ui-surface);
	}

	li a {
		display: flex;
		align-items: baseline;
		gap: var(--ui-space-4);
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.slug {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg);
		white-space: nowrap;
	}

	.title {
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flags {
		display: flex;
		align-items: center;
		gap: var(--ui-space-3);
		flex-shrink: 0;
	}

	.flags :global(.badge) {
		font-family: var(--ui-font);
	}

	.langs {
		font-family: var(--ui-font-mono);
		font-size: var(--ui-fs-sm);
		color: var(--ui-fg-muted);
	}
</style>
