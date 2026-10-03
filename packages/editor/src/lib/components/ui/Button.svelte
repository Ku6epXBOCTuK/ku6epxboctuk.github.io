<script lang="ts">
	import type { Snippet } from "svelte";

	/*
	 * Единственная кнопка редактора. Все варианты — здесь, чтобы «кнопочный»
	 * стиль не размножался по компонентам копиями.
	 *
	 * - plain — обычная;
	 * - primary — залитая акцентом, главное действие;
	 * - danger — контурная красная;
	 * - danger-solid — залитая красным, только в модалках подтверждения;
	 * - accent — контурная акцентная, действие-дозаполнение у поля.
	 */

	interface Props {
		variant?: "plain" | "primary" | "danger" | "danger-solid" | "accent";
		size?: "md" | "sm" | "xs";
		type?: "button" | "submit";
		disabled?: boolean;
		title?: string;
		"aria-label"?: string;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = "plain",
		size = "md",
		type = "button",
		disabled = false,
		title,
		onclick,
		children,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	class="btn {variant} {size}"
	{disabled}
	{title}
	{...rest}
	{onclick}
>
	{@render children()}
</button>

<style>
	.btn {
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--pad-btn);
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.btn.sm {
		font-size: var(--fs-sm);
		padding: var(--pad-btn-sm);
	}

	.btn.xs {
		font-size: var(--fs-sm);
		padding: var(--pad-btn-xs);
		border-radius: var(--r-chip);
	}

	.btn.primary {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
		font-weight: 600;
	}

	.btn.danger {
		color: var(--danger);
		background: transparent;
		border-color: var(--line-danger);
	}

	.btn.danger-solid {
		color: var(--on-danger);
		background: var(--danger-strong);
		border-color: var(--danger-strong);
		font-weight: 600;
	}

	.btn.accent {
		font-size: var(--fs-sm);
		padding: var(--pad-btn-sm);
		color: var(--accent);
		background: transparent;
		border-color: var(--accent-dim);
	}

	.btn:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}

	.btn.primary:hover:not(:disabled) {
		color: var(--bg);
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	.btn.danger:hover:not(:disabled) {
		color: var(--text);
		background: var(--danger-wash);
	}

	.btn.danger-solid:hover:not(:disabled) {
		color: var(--on-danger);
		background: var(--danger);
		border-color: var(--danger);
	}

	.btn.accent:hover:not(:disabled) {
		color: var(--accent);
		background: var(--accent-wash);
	}
</style>
