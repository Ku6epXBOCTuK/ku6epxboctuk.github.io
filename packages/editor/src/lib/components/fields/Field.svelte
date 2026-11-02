<script lang="ts">
	import { tidyTags } from "@ku6epxboctuk/content-core/shared";
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import FieldShell from "@ku6epxboctuk/ui-kit/components/Field";
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
		/** NOTE: two copies of the form (RU and EN) share the page, so control ids need a prefix. */
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

{#snippet control(id: string)}
	{#if field.kind === "string[]"}
		<TagsField {id} {disabled} value={list} {onchange} />
	{:else if field.kind === "choice"}
		<ChoiceControl
			{id}
			{disabled}
			value={String(scalar)}
			choices={field.choices ?? []}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "dir"}
		<DirField
			{id}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "icon"}
		<IconControl
			{id}
			{disabled}
			value={String(scalar)}
			choices={field.choices ?? []}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "number"}
		<NumberControl {id} {disabled} value={scalar} {onchange} />
	{:else if field.kind === "date"}
		<DateControl
			{id}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "text"}
		<TextAreaControl
			{id}
			{disabled}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "image"}
		<ImageField
			{id}
			{disabled}
			{slug}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else}
		<TextControl
			{id}
			{disabled}
			{mono}
			kind={field.kind === "url" ? "url" : "string"}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{/if}
{/snippet}

{#if field.kind === "boolean"}
	<div class="field" data-kind="boolean">
		<label class="label" for={controlId}>
			{field.label}{#if field.required}<span class="req" title="обязательное"
					>*</span
				>{/if}
		</label>
		<BooleanControl id={controlId} {value} {disabled} {onchange} />
		{#if field.help}
			<span class="help">{field.help}</span>
		{/if}
	</div>
{:else}
	<div class="field">
		<FieldShell
			label={field.label}
			required={field.required}
			hint={field.help}
			id={controlId}
		>
			{@render control(controlId)}
		</FieldShell>
		{#if actionLabel && onaction}
			<div class="action">
				<Button variant="secondary" {disabled} onclick={onaction}
					>{actionLabel}</Button
				>
			</div>
		{/if}
	</div>
{/if}

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-2);
		padding: var(--ui-space-4) 0;
		border-bottom: 1px solid var(--ui-line);
	}

	.field:last-child {
		border-bottom: none;
		padding-bottom: var(--ui-space-2);
	}

	.field[data-kind="boolean"] {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ui-space-3);
	}

	.label {
		font-size: var(--ui-fs-md);
		font-weight: 700;
		letter-spacing: var(--track-label);
		color: var(--ui-fg);
	}

	.req {
		color: var(--ui-danger);
	}

	.help {
		font-size: var(--ui-fs-md);
		line-height: var(--ui-lh);
		color: var(--ui-fg-muted);
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
