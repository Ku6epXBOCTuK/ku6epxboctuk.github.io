<script lang="ts">
	import { tidyTags } from "@ku6epxboctuk/content-core/shared";
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import Button from "../ui/Button.svelte";
	import BooleanControl from "./BooleanControl.svelte";
	import ChoiceControl from "./ChoiceControl.svelte";
	import DateControl from "./DateControl.svelte";
	import DirField from "./DirField.svelte";
	import IconControl from "./IconControl.svelte";
	import ImageField from "./ImageField.svelte";
	import NumberControl from "./NumberControl.svelte";
	import TagsField from "./TagsField.svelte";
	import TextAreaControl from "./TextAreaControl.svelte";
	import TextControl from "./TextControl.svelte";

	interface Props {
		field: FieldDef;
		value: unknown;
		disabled?: boolean;
		slug?: string;
		/** Префикс `id` контрола: на странице две копии формы (RU и EN). */
		scope?: string;
		actionLabel?: string;
		onaction?: () => void;
		onchange: (value: unknown) => void;
	}

	let {
		field,
		value,
		disabled = false,
		slug = "",
		scope = "",
		actionLabel,
		onaction,
		onchange,
	}: Props = $props();

	const controlId = $derived(scope ? `${scope}-${field.name}` : field.name);

	const list = $derived(
		Array.isArray(value) ? tidyTags(value) : ([] as string[]),
	);

	const scalar = $derived(
		typeof value === "string" || typeof value === "number" ? value : "",
	);

	const MONO_FIELDS = new Set(["slug", "path", "repo", "image"]);

	const mono = $derived(MONO_FIELDS.has(field.name));
</script>

<div class="field" data-kind={field.kind}>
	<label class="label" for={controlId}>
		{field.label}{#if field.required}<span class="req" title="обязательное"
				>*</span
			>{/if}
	</label>

	{#if field.kind === "boolean"}
		<BooleanControl id={controlId} {value} {disabled} {onchange} />
	{:else if field.kind === "string[]"}
		<TagsField id={controlId} {disabled} value={list} {onchange} />
	{:else if field.kind === "choice"}
		<ChoiceControl
			id={controlId}
			{disabled}
			value={String(scalar)}
			choices={field.choices ?? []}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "dir"}
		<DirField
			id={controlId}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "icon"}
		<IconControl
			id={controlId}
			{disabled}
			value={String(scalar)}
			choices={field.choices ?? []}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "number"}
		<NumberControl id={controlId} {disabled} value={scalar} {onchange} />
	{:else if field.kind === "date"}
		<DateControl
			id={controlId}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "text"}
		<TextAreaControl
			id={controlId}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "image"}
		<ImageField
			id={controlId}
			{disabled}
			{slug}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else}
		<TextControl
			id={controlId}
			{disabled}
			{mono}
			kind={field.kind === "url" ? "url" : "string"}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{/if}

	{#if actionLabel && onaction}
		<div class="action">
			<Button variant="accent" {disabled} onclick={onaction}
				>{actionLabel}</Button
			>
		</div>
	{/if}
	{#if field.help}
		<span class="help">{field.help}</span>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--gap-1);
		padding: var(--gap-3) 0;
		border-bottom: 1px solid var(--line);
	}

	.field:last-child {
		border-bottom: none;
		padding-bottom: var(--gap-1);
	}

	.field[data-kind="boolean"] {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-2);
	}

	.label {
		font-size: var(--fs-label);
		font-weight: 700;
		letter-spacing: var(--track-label);
		color: var(--text);
	}

	.req {
		color: var(--danger);
	}

	.help {
		font-size: var(--fs-sm);
		line-height: var(--lh-base);
		color: var(--text-faint);
	}

	.field[data-kind="boolean"] .help {
		order: 3;
		flex-basis: 100%;
		margin: 0;
	}

	.action {
		display: flex;
		margin-top: var(--gap-half);
	}
</style>
