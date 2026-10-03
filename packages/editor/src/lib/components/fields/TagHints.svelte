<script lang="ts">
	interface Props {
		suggestions: string[];
		needle: string;
		disabled?: boolean;
		onpick: (tag: string) => void;
	}

	let { suggestions, needle, disabled = false, onpick }: Props = $props();

	const NO_MATCH = -1;
</script>

<ul class="hints">
	{#each suggestions as tag (tag)}
		{@const at = needle === "" ? NO_MATCH : tag.indexOf(needle)}
		<li>
			<button
				type="button"
				{disabled}
				onmousedown={(e) => {
					// Иначе поле теряет фокус до клика, и список закрывается без выбора.
					e.preventDefault();
					onpick(tag);
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

<style>
	.hints {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 5;
		list-style: none;
		margin: var(--gap-half) 0 0;
		padding: var(--gap-05);
		max-height: var(--hints-max-h);
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
		padding: var(--pad-btn-sm);
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

	.hints button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}
</style>
