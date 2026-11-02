<script lang="ts">
	import type { ValidationReport } from "$lib/types";

	interface Props {
		report: ValidationReport | null;
	}

	let { report }: Props = $props();
</script>

{#if report && (report.errors.length > 0 || report.warnings.length > 0)}
	<div class="panel" data-state={report.errors.length > 0 ? "bad" : "warn"}>
		{#if report.errors.length > 0}
			<div class="group">
				<h3>Ошибки ({report.errors.length})</h3>
				<ul>
					{#each report.errors as line (line)}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if report.warnings.length > 0}
			<div class="group">
				<h3>Предупреждения ({report.warnings.length})</h3>
				<ul>
					{#each report.warnings as line (line)}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{:else if report}
	<p class="ok">Замечаний нет.</p>
{/if}

<style>
	.panel {
		border: 1px solid color-mix(in srgb, var(--ui-danger) 50%, var(--ui-line));
		background: var(--ui-danger-surface);
		border-radius: var(--ui-r-panel);
		padding: var(--ui-space-4);
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-3);
	}

	.panel[data-state="warn"] {
		border-color: color-mix(in srgb, var(--ui-warning) 50%, var(--ui-line));
		background: var(--ui-warning-surface);
	}

	.group h3 {
		margin: 0 0 var(--ui-space-1);
		font-size: var(--ui-fs-md);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ui-label-track);
		color: var(--ui-danger);
	}

	.panel[data-state="warn"] .group h3 {
		color: var(--ui-warning);
	}

	ul {
		margin: 0;
		padding-left: var(--ui-space-5);
		display: flex;
		flex-direction: column;
		gap: var(--gap-half);
	}

	li {
		font-size: var(--ui-fs-md);
		font-family: var(--ui-font-mono);
		line-height: var(--ui-lh);
		color: var(--ui-fg-secondary);
	}

	.ok {
		margin: 0;
		padding: var(--pad-row);
		border: 1px solid var(--ui-line);
		border-radius: var(--ui-r-control);
		background: var(--ui-surface);
		font-size: var(--ui-fs-lg);
		color: var(--ui-fg-muted);
	}
</style>
