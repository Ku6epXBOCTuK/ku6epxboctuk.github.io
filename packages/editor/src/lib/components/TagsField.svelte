<script lang="ts">
	import { tick } from "svelte";
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";

	/*
	 * Поле тегов: чипы в одной строке с вводом. Тег добавляется без Enter —
	 * пробелом или запятой, а Enter берёт первую подсказку. Чипы можно
	 * перетаскивать, клик по чипу копирует тег в буфер.
	 */

	interface Props {
		id?: string;
		value: string[];
		disabled?: boolean;
		onchange: (value: string[]) => void;
	}

	let { id = "", value, disabled = false, onchange }: Props = $props();

	/*
	 * Список подсказок закрывается по `blur`, но клик по кнопке подсказки тоже
	 * считается blur'ом: без паузы кнопка не успевает сработать. Отсюда задержка
	 * в один кадр — меньше неё не работает, больше не нужно.
	 */
	const HINT_CLOSE_MS = 150;

	/** Сколько чип показывает «скопировано» после клика. */
	const COPIED_MS = 900;

	let known = $state<string[]>([]);
	let query = $state("");
	let open = $state(false);
	/** Индекс чипа, который сейчас тащат. */
	let dragging = $state<number | null>(null);
	/** Тег, скопированный только что: чип ненадолго меняет подпись. */
	let copied = $state("");

	const chosen = $derived(value);
	/** Запрос для фильтра и подсветки: теги нечувствительны к регистру. */
	const needle = $derived(query.trim().toLowerCase());

	/** Из уже использованных — те, что ещё не выбраны и подходят под запрос. */
	const suggestions = $derived(
		known.filter(
			(tag) => !chosen.includes(tag) && (needle === "" || tag.includes(needle)),
		),
	);

	const typed = $derived(normalizeTag(query));
	const typedError = $derived(typed ? tagError(typed) : null);

	/** Совпадения нет: `indexOf` вернул -1. */
	const NO_MATCH = -1;

	/** Держим ссылку, чтобы вернуть фокус после добавления тега. */
	let input = $state<HTMLInputElement | null>(null);

	async function loadKnown() {
		try {
			const res = await fetch("/api/tags");
			if (!res.ok) return;
			const data = (await res.json()) as { tags: { tag: string }[] };
			// Словарь и уже использованные — оба. Словарь полезен тем, что в нём
			// есть теги, которых ещё нигде нет.
			known = data.tags.map((entry) => entry.tag);
		} catch {
			// Список подсказок — удобство, а не условие работы поля: без него
			// теги всё равно добавляются вручную.
		}
	}

	$effect(() => {
		void loadKnown();
	});

	/** Добавить кучей: кусок текста режется на теги пробелами и запятыми. */
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

		/*
		 * Фокус возвращаем после обновления дерева, а не сразу: пока список тегов
		 * не перерисовался, `input` ещё может быть старым узлом, и фокус встал бы
		 * в него и тут же потерялся при замене.
		 */
		await tick();
		input?.focus();
	}

	function remove(tag: string) {
		onchange(chosen.filter((item) => item !== tag));
	}

	/*
	 * Автодобавление: разделитель (пробел, запятая) заканчивает тег прямо по
	 * мере ввода. Заодно это чинит вставку списка тегов из буфера.
	 */
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
			// Enter сначала берёт подсказку, если она есть: так подсказка не
			// остаётся мимо, когда её видно.
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
			// Буфер может быть недоступен (права, не secure context) — тег от
			// этого не ломается, просто не копируется.
		}
	}
</script>

<div class="tags-field">
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="box" onclick={() => input?.focus()}>
		{#if chosen.length > 0}
			<ul class="chips">
				{#each chosen as tag, index (tag)}
					<li
						class:dragging={dragging === index}
						draggable={disabled ? "false" : "true"}
						ondragstart={(e) => dragStart(e, index)}
						ondragover={(e) => e.preventDefault()}
						ondrop={(e) => drop(e, index)}
						ondragend={() => (dragging = null)}
					>
						<button
							type="button"
							class="tag"
							title="копировать"
							{disabled}
							onclick={() => void copy(tag)}
						>
							{copied === tag ? "скопировано" : tag}
						</button>
						<button
							type="button"
							class="x"
							aria-label="убрать тег {tag}"
							{disabled}
							onclick={() => remove(tag)}
						>
							×
						</button>
					</li>
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
		<ul class="hints">
			{#each suggestions as tag (tag)}
				{@const at = needle === "" ? NO_MATCH : tag.indexOf(needle)}
				<li>
					<button
						type="button"
						{disabled}
						onmousedown={(e) => {
							// Без `preventDefault` поле успевает потерять фокус, и
							// вернуть его пришлось бы угадыванием — проще не дать
							// фокусу уйти вовсе.
							e.preventDefault();
							void add(tag);
						}}
					>
						{#if at >= 0}
							{tag.slice(0, at)}<mark>{tag.slice(at, at + needle.length)}</mark
							>{tag.slice(at + needle.length)}
						{:else}
							{tag}
						{/if}
					</button>
				</li>
			{/each}
		</ul>
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

	/*
	 * Стили поля и кнопок здесь свои: scoped-правила `Field.svelte` до
	 * внутренностей дочернего компонента не достают, а без них вход рисуется
	 * браузером — светло-серый с чёрным текстом, то есть нечитаемо на тёмной
	 * теме.
	 *
	 * Порядок — по возрастанию специфичности, иначе stylelint ругается.
	 */

	/*
	 * Вся строка — одно «поле»: рамка у обёртки, а не у input, чтобы чипы
	 * лежали внутри той же рамки.
	 */
	.box {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
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
		padding: 3px;
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
		gap: 4px;
		margin: 0;
		padding: 0;
	}

	.chips li {
		display: inline-flex;
		align-items: center;
		font-size: var(--fs-sm);
		background: var(--accent-wash);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
	}

	.chips li.dragging {
		opacity: 0.4;
	}

	.chips button {
		font: inherit;
		font-size: var(--fs-sm);
		background: transparent;
		border: none;
		line-height: 1;
		cursor: pointer;
	}

	.chips .tag {
		padding: 2px 0 2px 8px;
		color: var(--text);
	}

	.chips .x {
		padding: 2px 4px;
		color: var(--text-dim);
	}

	/*
	 * Подсказки лежат поверх поля: если раздвинуть поток, список подвигает всю
	 * форму при каждом нажатии. Поэтому `position: absolute` и своя тень.
	 */
	.hints {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 5;
		list-style: none;
		margin: 2px 0 0;
		padding: 4px;
		max-height: 180px;
		overflow-y: auto;
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		box-shadow: var(--shadow-panel);
	}

	.hints button {
		display: block;
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: var(--fs-md);
		padding: 5px 9px;
		color: var(--text-dim);
		background: transparent;
		border: none;
		border-radius: var(--r-control);
		cursor: pointer;
	}

	.hints mark {
		color: var(--accent);
		background: transparent;
	}

	.chips .x:hover:not(:disabled) {
		color: var(--danger);
	}

	.hints button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}

	.bad {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--danger);
	}
</style>
