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
		border: 1px solid #e0c0c0;
		background: #fdf5f5;
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.panel[data-state="warn"] {
		border-color: #e5d5a8;
		background: #fdfaf0;
	}

	.group h3 {
		margin: 0 0 4px;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #7a2020;
	}

	.panel[data-state="warn"] .group h3 {
		color: #8a6d1f;
	}

	ul {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	li {
		font-size: 12px;
		font-family: ui-monospace, monospace;
		line-height: 1.5;
	}

	.ok {
		margin: 0;
		font-size: 12px;
		color: #2c6b2c;
	}
</style>
