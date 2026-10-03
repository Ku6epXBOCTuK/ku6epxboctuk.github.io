<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import type { EntrySummary } from "@ku6epxboctuk/content-core/shared";
	import ConfirmModal from "../ConfirmModal.svelte";
	import Badge from "../ui/Badge.svelte";
	import Button from "../ui/Button.svelte";

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
	<h2>
		{label}
		<Badge pill>{units.length}</Badge>
	</h2>
{/if}

{#if errorText}
	<p class="bad">{errorText}</p>
{/if}

<ul>
	{#each units as unit (unit.slug)}
		<li>
			<a href="/{unit.type}/{unit.slug}">
				<span class="slug">{unit.slug}</span>
				<span class="title">{unit.title}</span>
			</a>
			<span class="flags">
				{#if unit.draft}<Badge>черновик</Badge>{/if}
				{#if unit.needsTranslation}
					<Badge tone="warn">перевод</Badge>
				{/if}
				<span class="langs">{unit.langs.join(" ")}</span>
				<Button
					variant="danger"
					size="sm"
					disabled={busy}
					onclick={() => (removing = unit)}>удалить</Button
				>
			</span>
		</li>
	{/each}
</ul>

{#if removing}
	<ConfirmModal
		title="Удалить единицу?"
		body={`${removing.type}/${removing.slug} исчезнет вместе с обоими файлами. Отменить это нельзя.`}
		confirmLabel="да, удалить"
		disabled={busy}
		oncancel={() => (removing = null)}
		onconfirm={doDelete}
	/>
{/if}

<style>
	h2 {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		margin: var(--gap-6) 0 var(--gap-2);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--text-faint);
	}

	h2 :global(.badge) {
		letter-spacing: 0;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-3);
		padding: var(--pad-row);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	li:hover {
		background: var(--surface);
	}

	li a {
		display: flex;
		align-items: baseline;
		gap: var(--gap-3);
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.slug {
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		color: var(--text);
		white-space: nowrap;
	}

	.title {
		font-size: var(--fs-md);
		color: var(--text-dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flags {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-shrink: 0;
	}

	.flags :global(.badge) {
		font-family: var(--font-ui);
	}

	.langs {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}

	.bad {
		margin: var(--gap-2) 0;
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
