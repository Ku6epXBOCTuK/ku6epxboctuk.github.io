<script lang="ts">
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import ImageField from "./ImageField.svelte";

	interface Props {
		field: FieldDef;
		value: unknown;
		disabled?: boolean;
		onchange: (value: unknown) => void;
	}

	let { field, value, disabled = false, onchange }: Props = $props();

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

<label class="field" data-kind={field.kind}>
	<span class="label">
		{field.label}{#if field.required}<span class="req" title="обязательное"
				>*</span
			>{/if}
	</span>

	{#if field.kind === "boolean"}
		<input
			type="checkbox"
			{disabled}
			checked={value === true}
			onchange={(e) => onchange(e.currentTarget.checked)}
		/>
	{:else if field.kind === "string[]"}
		<input
			type="text"
			{disabled}
			value={list}
			placeholder="svelte, css"
			oninput={(e) => tags(e.currentTarget.value)}
		/>
	{:else if field.kind === "choice"}
		<select
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
			type="number"
			{disabled}
			value={scalar}
			oninput={(e) => number(e.currentTarget.value)}
		/>
	{:else if field.kind === "date"}
		<input
			type="date"
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{:else if field.kind === "text"}
		<textarea
			{disabled}
			rows="3"
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		></textarea>
	{:else if field.kind === "image"}
		<ImageField {disabled} value={String(scalar)} onchange={text} />
	{:else}
		<input
			type={field.kind === "url" ? "url" : "text"}
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{/if}

	{#if field.help}
		<span class="help">{field.help}</span>
	{/if}
</label>

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
</style>
