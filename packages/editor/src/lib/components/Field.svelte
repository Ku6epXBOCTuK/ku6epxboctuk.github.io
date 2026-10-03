<script lang="ts">
	import { tidyTags } from "@ku6epxboctuk/content-core/shared";
	import type { FieldDef } from "@ku6epxboctuk/content-core/shared";
	import DirField from "./DirField.svelte";
	import ImageField from "./ImageField.svelte";
	import TagsField from "./TagsField.svelte";

	interface Props {
		field: FieldDef;
		value: unknown;
		disabled?: boolean;
		slug?: string;
		/**
		 * Уникальный префикс для `id` и `for`. На странице две копии одной формы —
		 * RU и EN, поэтому без префикса у полей совпадают `id`, и подпись RU ведёт
		 * на контрол EN. `id` получается `${scope}-${name}`, поэтому сам `scope`
		 * уже должен быть готовым идентификатором, без имени поля на конце.
		 */
		scope?: string;
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
		scope = "",
		actionLabel,
		onaction,
		onchange,
	}: Props = $props();

	const controlId = $derived(scope ? `${scope}-${field.name}` : field.name);

	const list2 = $derived(
		Array.isArray(value) ? tidyTags(value) : ([] as string[]),
	);

	const scalar = $derived(
		typeof value === "string" || typeof value === "number" ? value : "",
	);

	/** slug, path и repo — это данные, а не проза: показываем моноширинным. */
	const MONO_FIELDS = new Set(["slug", "path", "repo", "image"]);

	const mono = $derived(MONO_FIELDS.has(field.name));

	function text(next: string) {
		onchange(next);
	}

	function number(next: string) {
		onchange(next === "" ? undefined : Number(next));
	}
</script>

<!-- Обёртка div, а не label: у поля-картинки два контрола, и метка с двумя
     input внутри получается неоднозначной для клика и для скринридера. -->
<div class="field" data-kind={field.kind}>
	<label class="label" for={controlId}>
		{field.label}{#if field.required}<span class="req" title="обязательное"
				>*</span
			>{/if}
	</label>

	{#if field.kind === "boolean"}
		<input
			id={controlId}
			type="checkbox"
			{disabled}
			checked={value === true}
			onchange={(e) => onchange(e.currentTarget.checked)}
		/>
	{:else if field.kind === "string[]"}
		<TagsField
			id={controlId}
			{disabled}
			value={list2}
			onchange={(next) => onchange(next)}
		/>
	{:else if field.kind === "choice"}
		<select
			id={controlId}
			{disabled}
			value={scalar}
			onchange={(e) => text(e.currentTarget.value)}
		>
			<option value="">—</option>
			{#each field.choices ?? [] as choice (choice)}
				<option value={choice}>{choice}</option>
			{/each}
		</select>
	{:else if field.kind === "dir"}
		<DirField
			id={controlId}
			{disabled}
			value={String(scalar)}
			onchange={text}
		/>
	{:else if field.kind === "icon"}
		<!-- Глифы показываются теми же символами, какие попадут в текст: иначе
		     приходится запоминать, как `⬡` выглядит в коде. -->
		<div class="icon-grid" role="radiogroup" aria-labelledby={controlId}>
			{#each field.choices ?? [] as glyph (glyph)}
				<button
					type="button"
					class="glyph"
					class:on={scalar === glyph}
					role="radio"
					aria-checked={scalar === glyph}
					aria-label={`иконка ${glyph}`}
					{disabled}
					onclick={() => text(glyph)}
				>
					{glyph}
				</button>
			{/each}
			<button
				type="button"
				class="glyph clear"
				class:on={scalar === ""}
				role="radio"
				aria-checked={scalar === ""}
				aria-label="без иконки"
				{disabled}
				onclick={() => text("")}
			>
				—
			</button>
		</div>
	{:else if field.kind === "number"}
		<input
			id={controlId}
			type="number"
			{disabled}
			value={scalar}
			oninput={(e) => number(e.currentTarget.value)}
		/>
	{:else if field.kind === "date"}
		<input
			id={controlId}
			type="date"
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{:else if field.kind === "text"}
		<textarea
			id={controlId}
			{disabled}
			rows="3"
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		></textarea>
	{:else if field.kind === "image"}
		<ImageField
			id={controlId}
			{disabled}
			{slug}
			value={String(scalar)}
			onchange={text}
		/>
	{:else}
		<input
			id={controlId}
			class:mono
			type={field.kind === "url" ? "url" : "text"}
			{disabled}
			value={scalar}
			oninput={(e) => text(e.currentTarget.value)}
		/>
	{/if}

	{#if actionLabel && onaction}
		<div class="action">
			<button type="button" {disabled} onclick={onaction}>{actionLabel}</button>
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
		gap: 7px;
		padding: 14px 0;
		border-bottom: 1px solid var(--line);
	}

	.field:last-child {
		border-bottom: none;
		padding-bottom: 6px;
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
		letter-spacing: 0.01em;
		color: var(--text);
	}

	.req {
		color: var(--danger);
	}

	input[type="text"],
	input[type="url"],
	input[type="number"],
	input[type="date"],
	textarea,
	select {
		font: inherit;
		font-size: var(--fs-md);
		padding: 7px 9px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.mono {
		font-family: var(--font-mono);
		font-size: var(--fs-md);
	}

	textarea {
		resize: vertical;
		line-height: 1.55;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--text-faint);
	}

	input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
	}

	/*
	 * Пикер глифа: сетка квадратов с самими символами. Кнопка, а не select,
	 * потому что выбирается картинка, а не название картинки.
	 */
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
		gap: 4px;
		max-width: 340px;
	}

	.glyph {
		font: inherit;
		font-size: 16px;
		line-height: 1;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		padding: 0;
		color: var(--text-dim);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
		transition:
			color 100ms,
			border-color 100ms,
			background 100ms;
	}

	.glyph:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.glyph:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.glyph:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--accent);
	}

	.glyph.on {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
	}

	.glyph.clear {
		color: var(--text-faint);
	}

	.help {
		font-size: var(--fs-sm);
		line-height: 1.5;
		color: var(--text-faint);
	}
	.field[data-kind="boolean"] .help {
		order: 3;
		flex-basis: 100%;
		margin: 0;
	}

	input:disabled,
	textarea:disabled,
	select:disabled {
		background: var(--surface);
		color: var(--text-faint);
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--accent);
	}

	input:hover:not(:disabled),
	textarea:hover:not(:disabled),
	select:hover:not(:disabled) {
		border-color: #4d535f;
	}

	.action {
		display: flex;
		margin-top: 2px;
	}

	.action button {
		font: inherit;
		font-size: var(--fs-sm);
		padding: 4px 10px;
		color: var(--accent);
		background: transparent;
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.action button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.action button:hover:not(:disabled) {
		background: var(--accent-wash);
	}
</style>
