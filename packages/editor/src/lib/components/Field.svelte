<script lang="ts">
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import ImageField from "./ImageField.svelte";

	interface Props {
		field: FieldDef;
		value: unknown;
		disabled?: boolean;
		slug?: string;
		/** Необязательное действие под контролом — дозаполнение извне. */
		actionLabel?: string;
		onaction?: () => void;
		onchange: (value: unknown) => void;
	}

	let {
		field,
		value,
		disabled = false,
		slug = "",
		actionLabel,
		onaction,
		onchange,
	}: Props = $props();

	const list = $derived(
		Array.isArray(value) ? (value as string[]).join(", ") : "",
	);

	const scalar = $derived(
		typeof value === "string" || typeof value === "number" ? value : "",
	);

	function text(next: string) {
		onchange(next);
	}

	function tags(next: string) {
		onchange(
			next
				.split(",")
				.map((item) => item.trim().toLowerCase())
				.filter(Boolean),
		);
	}

	function number(next: string) {
		onchange(next === "" ? undefined : Number(next));
	}
</script>

<!-- Обёртка div, а не label: у поля-картинки два контрола, и метка с двумя
     input внутри получается неоднозначной для клика и для скринридера. -->
<div class="field" data-kind={field.kind}>
	<label class="label" for={field.name}>
		{field.label}{#if field.required}<span class="req" title="обязательное"
				>*</span
			>{/if}
	</label>

	{#if field.kind === "boolean"}
		<input
			id={field.name}
			type="checkbox"
			{disabled}
			checked={value === true}
			onchange={(e) => onchange(e.currentTarget.checked)}
		/>
	{:else if field.kind === "string[]"}
		<input
			id={field.name}
			type="text"
			{disabled}
			value={list}
			placeholder="svelte, css"
			oninput={(e) => tags(e.currentTarget.value)}
		/>
	{:else if field.kind === "choice"}
		<select
			id={field.name}
			{disabled}
			value={scalar}
			onchange={(e) => text(e.currentTarget.value)}
		>
			<option value="">—</option>
			{#each field.choices ?? [] as choice (choice)}
				<option value={choice}>{choice}</option>
			{/each}
		</select>
	{:else if field.kind === "number"}
		<input
			id={field.name}
			type="number"
			{disabled}
			value={scalar}
			oninput={(e) => number(e.currentTarget.value)}
		/>
	{:else if field.kind === "date"}
		<input
			id={field.name}
			type="date"
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{:else if field.kind === "text"}
		<textarea
			id={field.name}
			{disabled}
			rows="3"
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		></textarea>
	{:else if field.kind === "image"}
		<ImageField
			id={field.name}
			{disabled}
			{slug}
			value={String(scalar)}
			onchange={text}
		/>
	{:else}
		<input
			id={field.name}
			type={field.kind === "url" ? "url" : "text"}
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{/if}

	{#if field.help}
		<span class="help">{field.help}</span>
	{/if}

	{#if actionLabel && onaction}
		<div class="action">
			<button type="button" {disabled} onclick={onaction}>{actionLabel}</button>
		</div>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 0;
		border-bottom: 1px solid #eee;
	}

	.label {
		font-size: 12px;
		font-weight: 600;
		color: #333;
	}

	.req {
		color: #b00020;
	}

	.help {
		font-size: 11px;
		color: #777;
	}

	input[type="text"],
	input[type="url"],
	input[type="number"],
	input[type="date"],
	textarea,
	select {
		font: inherit;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #fff;
	}

	textarea {
		resize: vertical;
	}

	input:disabled,
	textarea:disabled,
	select:disabled {
		background: #f4f4f4;
	}

	.action {
		display: flex;
		gap: 6px;
		margin-top: 2px;
	}

	.action button {
		font: inherit;
		font-size: 12px;
		padding: 4px 10px;
		border: 1px solid #bbb;
		border-radius: 5px;
		background: #fff;
		cursor: pointer;
	}

	.action button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
