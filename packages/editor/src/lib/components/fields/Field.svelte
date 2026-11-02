<script lang="ts">
	import { tagError, tidyTags } from "@ku6epxboctuk/content-core/shared";
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import { onMount } from "svelte";
	import Button from "@ku6epxboctuk/ui-kit/components/Button.svelte";
	import Checkbox from "@ku6epxboctuk/ui-kit/components/Checkbox.svelte";
	import FieldShell from "@ku6epxboctuk/ui-kit/components/Field.svelte";
	import TagInput from "@ku6epxboctuk/ui-kit/components/TagInput.svelte";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput.svelte";
	import { knownTags } from "$lib/tags";
	import ChoiceControl from "./ChoiceControl.svelte";
	import DirField from "./DirField.svelte";
	import IconControl from "./IconControl.svelte";
	import ImageField from "./ImageField.svelte";

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

	const inputType = $derived(
		field.kind === "number"
			? "number"
			: field.kind === "date"
				? "date"
				: field.kind === "url"
					? "url"
					: "text",
	);

	const shown = $derived(String(scalar));

	let suggestions = $state<string[]>([]);

	onMount(async () => {
		suggestions = await knownTags();
	});

	function ontext(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		if (field.kind === "number") {
			onchange(raw === "" ? undefined : Number(raw));
			return;
		}
		onchange(raw);
	}
</script>

{#snippet control(id: string)}
	{#if field.kind === "string[]"}
		<TagInput
			{id}
			{disabled}
			value={list}
			{onchange}
			{suggestions}
			validate={tagError}
			showAll={false}
			reorderable
			copyable
			copiedLabel="скопировано"
			copyLabel={(tag) => `скопировать тег ${tag}`}
			ariaLabel="теги"
			placeholder={list.length === 0 ? "добавить тег" : ""}
		/>
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
	{:else if field.kind === "image"}
		<ImageField
			{id}
			{disabled}
			{slug}
			value={String(scalar)}
			onchange={(next) => onchange(next)}
		/>
	{:else}
		<TextInput
			{id}
			{disabled}
			{mono}
			type={inputType}
			value={shown}
			oninput={ontext}
		/>
	{/if}
{/snippet}

{#snippet check(id: string)}
	<Checkbox
		{id}
		{disabled}
		checked={value === true}
		onchange={(e) => onchange(e.currentTarget.checked)}
	/>
{/snippet}

<div class="field" data-kind={field.kind}>
	<FieldShell
		label={field.label}
		required={field.required}
		hint={field.help}
		id={controlId}
		orientation={field.kind === "boolean" ? "row" : "stack"}
	>
		{#if field.kind === "boolean"}
			{@render check(controlId)}
		{:else}
			{@render control(controlId)}
		{/if}
	</FieldShell>
	{#if actionLabel && onaction}
		<div class="action">
			<Button variant="secondary" {disabled} onclick={onaction}
				>{actionLabel}</Button
			>
		</div>
	{/if}
</div>

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

	.action {
		display: flex;
		margin-top: var(--gap-half);
	}
</style>
