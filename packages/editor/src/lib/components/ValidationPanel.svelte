<script lang="ts">
	import type { ValidationReport } from "$lib/types";
	import Notice from "@ku6epxboctuk/ui-kit/components/Notice";
	import SectionTitle from "@ku6epxboctuk/ui-kit/components/SectionTitle";

	interface Props {
		report: ValidationReport | null;
	}

	let { report }: Props = $props();

	const hasErrors = $derived(Boolean(report && report.errors.length > 0));
	const TITLE_LEVEL = 3;
</script>

{#if report && (report.errors.length > 0 || report.warnings.length > 0)}
	<Notice variant="box" tone={hasErrors ? "danger" : "warning"} role="status">
		{#if report.errors.length > 0}
			<div class="group">
				<SectionTitle level={TITLE_LEVEL} tone="danger"
					>Ошибки ({report.errors.length})</SectionTitle
				>
				<ul>
					{#each report.errors as line (line)}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if report.warnings.length > 0}
			<div class="group">
				<SectionTitle level={TITLE_LEVEL} tone="warning"
					>Предупреждения ({report.warnings.length})</SectionTitle
				>
				<ul>
					{#each report.warnings as line (line)}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</Notice>
{:else if report}
	<Notice variant="box" size="lg">Замечаний нет.</Notice>
{/if}

<style>
	.group {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-1);
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
</style>
