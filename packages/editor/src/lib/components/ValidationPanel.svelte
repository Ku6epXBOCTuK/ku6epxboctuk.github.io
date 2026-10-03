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
		border: 1px solid var(--line-danger);
		background: var(--danger-wash);
		border-radius: var(--r-panel);
		padding: var(--gap-3);
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
	}

	.panel[data-state="warn"] {
		border-color: var(--line-warn);
		background: var(--warn-wash);
	}

	.group h3 {
		margin: 0 0 var(--gap-05);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--track-caps);
		color: var(--danger);
	}

	.panel[data-state="warn"] .group h3 {
		color: var(--warn);
	}

	ul {
		margin: 0;
		padding-left: var(--gap-4);
		display: flex;
		flex-direction: column;
		gap: var(--gap-half);
	}

	li {
		font-size: var(--fs-sm);
		font-family: var(--font-mono);
		line-height: var(--lh-copy);
		color: var(--text-dim);
	}

	.ok {
		margin: 0;
		padding: var(--pad-row);
		border: 1px solid var(--line);
		border-radius: var(--r-control);
		background: var(--surface);
		font-size: var(--fs-md);
		color: var(--text-faint);
	}
</style>
