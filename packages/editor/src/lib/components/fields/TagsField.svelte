<script lang="ts">
	import { onMount, tick } from "svelte";
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";
	import TagChip from "./TagChip.svelte";
	import TagHints from "./TagHints.svelte";

	interface Props {
		id?: string;
		value: string[];
		disabled?: boolean;
		onchange: (value: string[]) => void;
	}

	let { id = "", value, disabled = false, onchange }: Props = $props();

	// Подсказки закрываются по blur, но клик по подсказке — тоже blur:
	// без паузы в кадр кнопка не успевает сработать.
	const HINT_CLOSE_MS = 150;
	const COPIED_MS = 900;

	let known = $state<string[]>([]);
	let query = $state("");
	let open = $state(false);
	let dragging = $state<number | null>(null);
	let copied = $state("");

	const chosen = $derived(value);
	const needle = $derived(query.trim().toLowerCase());

	const suggestions = $derived(
		known.filter(
			(tag) => !chosen.includes(tag) && (needle === "" || tag.includes(needle)),
		),
	);

	const typed = $derived(normalizeTag(query));
	const typedError = $derived(typed ? tagError(typed) : null);

	let input = $state<HTMLInputElement | null>(null);

	async function loadKnown() {
		try {
			const res = await fetch("/api/tags");
			if (!res.ok) return;
			const data = (await res.json()) as { tags: { tag: string }[] };
			known = data.tags.map((entry) => entry.tag);
		} catch {
			// Подсказки — удобство, а не условие работы: теги добавляются и вручную.
		}
	}

	onMount(() => {
		void loadKnown();
	});

	function commit(parts: string[]) {
		const next = [...chosen];
		for (const part of parts) {
			const tag = normalizeTag(part);
			if (!tag || tagError(tag) || next.includes(tag)) continue;
			next.push(tag);
		}
		if (next.length !== chosen.length) onchange(next);
	}

	async function add(raw: string) {
		const tag = normalizeTag(raw);
		if (!tag || tagError(tag) || chosen.includes(tag)) return;

		onchange([...chosen, tag]);
		query = "";

		// Фокус — после обновления дерева: до tick input может быть старым узлом.
		await tick();
		input?.focus();
	}

	function remove(tag: string) {
		onchange(chosen.filter((item) => item !== tag));
	}

	// Разделитель (пробел, запятая) заканчивает тег прямо по мере ввода.
	function onType(event: Event) {
		const next = event.currentTarget as HTMLInputElement;
		const text = next.value;
		if (!/[\s,]/.test(text)) {
			query = text;
			return;
		}
		const parts = text.split(/[\s,]+/);
		query = parts.pop() ?? "";
		commit(parts);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			void add(suggestions[0] ?? typed);
			return;
		}
		if (event.key === "Escape") {
			open = false;
			return;
		}
		if (event.key === "Backspace" && query === "" && chosen.length > 0) {
			remove(chosen[chosen.length - 1]);
		}
	}

	function dragStart(event: DragEvent, index: number) {
		dragging = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", chosen[index]);
		}
	}

	function drop(event: DragEvent, index: number) {
		event.preventDefault();
		const from = dragging;
		dragging = null;
		if (from === null || from === index) return;

		const next = [...chosen];
		const [moved] = next.splice(from, 1);
		next.splice(index, 0, moved);
		onchange(next);
	}

	async function copy(tag: string) {
		try {
			await navigator.clipboard.writeText(tag);
			copied = tag;
			setTimeout(() => {
				if (copied === tag) copied = "";
			}, COPIED_MS);
		} catch {
			// Буфер может быть недоступен (права, не secure context).
		}
	}
</script>

<div class="tags-field">
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="box" onclick={() => input?.focus()}>
		{#if chosen.length > 0}
			<ul class="chips">
				{#each chosen as tag, index (tag)}
					<TagChip
						{tag}
						copied={copied === tag}
						dragging={dragging === index}
						{disabled}
						oncopy={(t) => void copy(t)}
						onremove={remove}
						ondragstart={(e) => dragStart(e, index)}
						ondrop={(e) => drop(e, index)}
						ondragend={() => (dragging = null)}
					/>
				{/each}
			</ul>
		{/if}
		<input
			bind:this={input}
			{id}
			type="text"
			{disabled}
			value={query}
			placeholder={chosen.length === 0 ? "добавить тег" : ""}
			autocomplete="off"
			oninput={onType}
			onfocus={() => (open = true)}
			onblur={() => setTimeout(() => (open = false), HINT_CLOSE_MS)}
			onkeydown={onKeydown}
		/>
	</div>

	{#if open && suggestions.length > 0}
		<TagHints
			{suggestions}
			{needle}
			{disabled}
			onpick={(tag) => void add(tag)}
		/>
	{/if}

	{#if typedError}
		<p class="bad">{typedError}</p>
	{/if}
</div>

<style>
	.tags-field {
		display: flex;
		flex-direction: column;
		gap: var(--gap-2);
		position: relative;
	}

	/* Рамка у обёртки, а не у input: чипы лежат внутри той же рамки. */
	.box {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--gap-05);
		padding: var(--gap-05) var(--gap-1);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: text;
	}

	.box input {
		flex: 1;
		min-width: 90px;
		font: inherit;
		font-size: var(--fs-md);
		padding: var(--gap-half);
		color: var(--text);
		background: transparent;
		border: none;
	}

	.box input::placeholder {
		color: var(--text-faint);
	}

	.box:focus-within {
		border-color: var(--accent);
	}

	.box input:focus {
		outline: none;
	}

	.chips {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap-05);
		margin: 0;
		padding: 0;
	}

	.bad {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--danger);
	}
</style>
