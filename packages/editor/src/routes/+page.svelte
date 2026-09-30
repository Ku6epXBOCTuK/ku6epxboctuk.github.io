<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import {
		CONTENT_TYPES,
		defaultsFor,
		isValidSlug,
		type ContentType,
		type UnitSummary,
	} from "@ku6epxboctuk/content-core/shared";

	const units = $derived(page.data.units as UnitSummary[]);

	const TYPE_LABEL: Record<ContentType, string> = {
		post: "Пост",
		article: "Статья",
		project: "Проект",
	};

	let newType = $state<ContentType>("post");
	let newSlug = $state("");
	let creating = $state(false);
	let errorText = $state("");

	const slugOk = $derived(isValidSlug(newSlug));

	async function create() {
		if (!slugOk) return;
		creating = true;
		errorText = "";
		try {
			const res = await fetch(`/api/units/${newType}/${newSlug}/ru`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ frontmatter: defaultsFor(newType), body: "" }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				errorText = json.error ?? `HTTP ${res.status}`;
				return;
			}
			await goto(`/${newType}/${newSlug}`);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}
</script>

<h1>Единицы контента</h1>

<section class="new">
	<select bind:value={newType}>
		{#each CONTENT_TYPES as type (type)}
			<option value={type}>{TYPE_LABEL[type]}</option>
		{/each}
	</select>
	<input
		type="text"
		bind:value={newSlug}
		placeholder="my-slug"
		aria-invalid={newSlug.length > 0 && !slugOk}
		onkeydown={(e) => e.key === "Enter" && create()}
	/>
	<button type="button" disabled={!slugOk || creating} onclick={create}>
		создать
	</button>
	{#if newSlug && !slugOk}
		<span class="bad">только a-z0-9 и дефисы</span>
	{/if}
	{#if errorText}<span class="bad">{errorText}</span>{/if}
</section>

{#if units.length === 0}
	<p class="note">
		Пока пусто. Создай первую единицу через поле выше — откроется форма с
		вкладками RU и EN.
	</p>
{:else}
	{#each CONTENT_TYPES as type (type)}
		{@const group = units.filter((unit) => unit.type === type)}
		{#if group.length > 0}
			<h2>{TYPE_LABEL[type]}</h2>
			<ul>
				{#each group as unit (unit.slug)}
					<li>
						<a href="/{unit.type}/{unit.slug}">
							<span class="slug">{unit.slug}</span>
							<span class="title">{unit.title}</span>
						</a>
						<span class="flags">
							{#if unit.draft}<span class="badge">черновик</span>{/if}
							{#if unit.needsTranslation}
								<span class="badge warn">нужен перевод</span>
							{/if}
							<span class="langs">{unit.langs.join(" / ")}</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
{/if}

<style>
	h1 {
		font-size: 20px;
		margin: 0 0 16px;
	}

	h2 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: #666;
		margin: 24px 0 8px;
	}

	.new {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 12px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		margin-bottom: 8px;
	}

	.new input,
	.new select {
		font: inherit;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.new input {
		flex: 1;
		min-width: 200px;
	}

	.new input[aria-invalid="true"] {
		border-color: #b00020;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 10px;
		border: 1px solid #eaeaea;
		border-radius: 6px;
	}

	li a {
		display: flex;
		align-items: baseline;
		gap: 10px;
		color: inherit;
		text-decoration: none;
	}

	.slug {
		font-weight: 600;
	}

	.title {
		font-size: 13px;
		color: #666;
	}

	.flags {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.badge {
		font-size: 11px;
		padding: 1px 7px;
		border: 1px solid #bbb;
		border-radius: 4px;
		color: #555;
	}

	.badge.warn {
		border-color: #d08a00;
		color: #a06a00;
	}

	.langs {
		font-size: 11px;
		color: #999;
	}

	.note,
	.bad {
		font-size: 13px;
		color: #666;
	}

	.bad {
		color: #b00020;
	}

	button {
		font: inherit;
		font-size: 13px;
		padding: 6px 14px;
		border: 1px solid #bbb;
		border-radius: 5px;
		background: #fff;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
