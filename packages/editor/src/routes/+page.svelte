<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import {
		CONTENT_TYPES,
		defaultsFor,
		draftSlug,
		type ContentType,
		type UnitSummary,
	} from "@ku6epxboctuk/content-core/shared";
	import type { GitHubProjectPayload } from "./api/github-project/+server";

	const units = $derived(page.data.units as UnitSummary[]);

	const TYPE_LABEL: Record<ContentType, string> = {
		post: "Пост",
		article: "Статья",
		project: "Проект",
	};

	let creating = $state(false);
	let errorText = $state("");
	let ghOpen = $state(false);
	let ghUrl = $state("");
	let ghNotes = $state<string[]>([]);

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	/** Создать единицу с черновым slug: без заголовка имя папки всё равно нужно. */
	async function createPlain(type: ContentType) {
		const slug = draftSlug(type);
		creating = true;
		errorText = "";
		try {
			const res = await fetch(`/api/units/${type}/${slug}/ru`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					frontmatter: defaultsFor(type),
					body: "",
				}),
			});
			if (!res.ok) {
				errorText =
					((await readJson(res)) as { error?: string }).error ??
					`HTTP ${res.status}`;
				return;
			}
			await goto(`/${type}/${slug}`);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}

	async function createFromGithub() {
		creating = true;
		errorText = "";
		ghNotes = [];
		try {
			const res = await fetch("/api/github-project", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: ghUrl }),
			});
			const json = (await readJson(res)) as GitHubProjectPayload & {
				error?: string;
			};
			if (!res.ok) {
				errorText = json.error ?? `HTTP ${res.status}`;
				return;
			}

			ghNotes = json.notes ?? [];
			const slug = json.slug;

			const saved = await fetch(`/api/units/project/${slug}/ru`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					frontmatter: { ...defaultsFor("project"), ...json.frontmatter },
					body: json.body ?? "",
				}),
			});
			if (!saved.ok) {
				errorText =
					((await readJson(saved)) as { error?: string }).error ??
					`HTTP ${saved.status}`;
				return;
			}
			await goto(`/project/${slug}`);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}
</script>

<h1>Единицы контента</h1>

<section class="new">
	<span class="new-label">Создать</span>
	<div class="new-buttons">
		<button
			type="button"
			disabled={creating}
			onclick={() => createPlain("post")}>пост</button
		>
		<button
			type="button"
			disabled={creating}
			onclick={() => createPlain("article")}>статья</button
		>
		<button
			type="button"
			disabled={creating}
			onclick={() => createPlain("project")}>пустой проект</button
		>
		<button type="button" disabled={creating} onclick={() => (ghOpen = !ghOpen)}
			>проект из ссылки</button
		>
	</div>

	{#if ghOpen}
		<div class="gh">
			<input
				type="text"
				bind:value={ghUrl}
				placeholder="https://github.com/owner/name"
				onkeydown={(e) => e.key === "Enter" && createFromGithub()}
			/>
			<button
				type="button"
				disabled={creating || !ghUrl.trim()}
				onclick={createFromGithub}
			>
				создать
			</button>
		</div>
		<p class="gh-hint">
			Подтянем описание, темы, демо, первый абзац README и картинку из него.
			Путь, порядок и статус заполняешь сама.
		</p>
	{/if}

	{#if ghNotes.length > 0}
		<ul class="notes">
			{#each ghNotes as note (note)}
				<li>{note}</li>
			{/each}
		</ul>
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
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		padding: 12px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		margin-bottom: 8px;
	}

	.new-label {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: #666;
	}

	.new-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.gh {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		width: 100%;
	}

	.gh input {
		font: inherit;
		flex: 1;
		min-width: 260px;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.gh-hint {
		margin: 0;
		font-size: 12px;
		color: #777;
	}

	.notes {
		margin: 0;
		padding-left: 18px;
		font-size: 12px;
		color: #8a6d1f;
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
