<script lang="ts">
	import type { UnitSummary } from "@ku6epxboctuk/content-core/shared";
	import Badge from "../ui/Badge.svelte";

	interface Props {
		label: string;
		units: UnitSummary[];
	}

	let { label, units }: Props = $props();
</script>

<h2>
	{label}
	<Badge pill>{units.length}</Badge>
</h2>
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
			</span>
		</li>
	{/each}
</ul>

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
</style>
