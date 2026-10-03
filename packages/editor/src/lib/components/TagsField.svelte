<script lang="ts">
	import { normalizeTag, tagError } from "@ku6epxboctuk/content-core/shared";

	/*
	 * Поле тегов: чипы выбранных, поиск по уже использованным и добавление
	 * нового прямо в строке.
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

	let known = $state<string[]>([]);
	let query = $state("");
	let open = $state(false);

	const chosen = $derived(value);

	/** Из уже использованных — те, что ещё не выбраны и подходят под запрос. */
	const suggestions = $derived(
		known.filter(
			(tag) =>
				!chosen.includes(tag) &&
				(query.trim() === "" || tag.includes(query.trim().toLowerCase())),
		),
	);

	const typed = $derived(normalizeTag(query));
	const typedError = $derived(typed ? tagError(typed) : null);

	async function loadKnown() {
		try {
			const res = await fetch("/api/tags");
			if (!res.ok) return;
			const data = (await res.json()) as { tags: { tag: string }[] };
			known = data.tags.map((entry) => entry.tag);
		} catch {
			// Список подсказок — удобство, а не условие работы поля: без него
			// теги всё равно добавляются вручную.
		}
	}

	$effect(() => {
		void loadKnown();
	});

	function add(tag: string) {
		const clean = normalizeTag(tag);
		if (!clean || tagError(clean) || chosen.includes(clean)) return;
		onchange([...chosen, clean]);
		query = "";
	}

	function remove(tag: string) {
		onchange(chosen.filter((item) => item !== tag));
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			// Enter сначала берёт подсказку, если она есть: так подсказка не
			// остаётся мимо, когда её видно.
			add(suggestions[0] ?? typed);
			return;
		}
		if (event.key === "Backspace" && query === "" && chosen.length > 0) {
			remove(chosen[chosen.length - 1]);
		}
	}
</script>

<div class="tags-field">
	<div class="row">
		<input
			{id}
			type="text"
			{disabled}
			bind:value={query}
			placeholder="добавить тег"
			autocomplete="off"
			onfocus={() => (open = true)}
			onblur={() => setTimeout(() => (open = false), HINT_CLOSE_MS)}
			onkeydown={onKeydown}
		/>
	</div>

	{#if chosen.length > 0}
		<ul class="chips">
			{#each chosen as tag (tag)}
				<li>
					<span>{tag}</span>
					<button
						type="button"
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

	{#if open && suggestions.length > 0}
		<ul class="hints">
			{#each suggestions as tag (tag)}
				<li>
					<button type="button" {disabled} onmousedown={() => add(tag)}>
						{tag}
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

	.row input {
		width: 100%;
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
		background: transparent;
		border: none;
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
		gap: 4px;
		padding: 2px 4px 2px 8px;
		font-size: var(--fs-sm);
		background: var(--accent-wash);
		border: 1px solid var(--accent-dim);
		border-radius: var(--r-control);
	}

	.chips button {
		padding: 0 4px;
		background: transparent;
		border: none;
		color: var(--text-dim);
		line-height: 1;
	}

	.chips button:hover:not(:disabled) {
		color: var(--danger);
	}

	.hints button:hover:not(:disabled) {
		background: var(--surface-3);
	}

	.bad {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--danger);
	}
</style>
