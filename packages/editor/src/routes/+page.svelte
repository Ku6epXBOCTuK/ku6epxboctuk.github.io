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
		post: "посты",
		article: "статьи",
		project: "проекты",
	};

	let creating = $state(false);
	let errorText = $state("");
	let ghUrl = $state("");
	let ghNotes = $state<string[]>([]);

	async function readJson(res: Response) {
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	async function createPlain(type: ContentType) {
		const slug = draftSlug(type);
		creating = true;
		errorText = "";
		try {
			const res = await fetch(`/api/entries/${type}/${slug}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ru: { frontmatter: defaultsFor(type), body: "" },
					en: { frontmatter: {}, body: "" },
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
		if (!ghUrl.trim()) return;
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

			const saved = await fetch(`/api/entries/project/${json.slug}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ru: {
						frontmatter: { ...defaultsFor("project"), ...json.frontmatter },
						body: json.body ?? "",
					},
					en: { frontmatter: {}, body: "" },
				}),
			});
			if (!saved.ok) {
				errorText =
					((await readJson(saved)) as { error?: string }).error ??
					`HTTP ${saved.status}`;
				return;
			}
			await goto(`/project/${json.slug}`);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}
</script>

<section class="create">
	<div class="row">
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
		<span class="sep" aria-hidden="true"></span>
		<div class="gh">
			<span class="gh-label">из github</span>
			<input
				type="text"
				bind:value={ghUrl}
				placeholder="owner/name"
				onkeydown={(e) => e.key === "Enter" && createFromGithub()}
			/>
			<button
				type="button"
				class="primary"
				disabled={creating || !ghUrl.trim()}
				onclick={createFromGithub}>создать</button
			>
		</div>
	</div>

	{#if ghNotes.length > 0}
		<ul class="notes">
			{#each ghNotes as note (note)}
				<li>{note}</li>
			{/each}
		</ul>
	{/if}
	{#if errorText}
		<p class="bad">{errorText}</p>
	{/if}
</section>

{#if units.length === 0}
	<p class="empty">Пока пусто. Создай первую единицу кнопкой выше.</p>
{:else}
	{#each CONTENT_TYPES as type (type)}
		{@const group = units.filter((unit) => unit.type === type)}
		{#if group.length > 0}
			<h2>
				{TYPE_LABEL[type]}
				<span class="count">{group.length}</span>
			</h2>
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
								<span class="badge warn">перевод</span>
							{/if}
							<span class="langs">{unit.langs.join(" ")}</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
{/if}

<style>
	.create {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		box-shadow: var(--shadow-panel);
		padding: var(--gap-3);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-wrap: wrap;
	}

	.sep {
		align-self: stretch;
		width: 1px;
		background: var(--line);
		margin: 0 var(--gap-1);
	}

	.gh {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		/* Без wrap и min-width кнопка «создать» уезжала за край панели на
		   узком экране: поле сжималось не до нуля, а до своей базы. */
		flex: 1 1 240px;
		min-width: 0;
		max-width: 440px;
		flex-wrap: wrap;
	}

	.gh-label {
		font-size: var(--fs-md);
		color: var(--text-faint);
		white-space: nowrap;
	}

	.gh input {
		font: inherit;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		flex: 1 1 140px;
		min-width: 0;
		padding: 7px 10px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
	}

	.gh input::placeholder {
		color: var(--text-faint);
	}

	button {
		font: inherit;
		font-size: var(--fs-md);
		padding: 6px 12px;
		color: var(--text-dim);
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: var(--r-control);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	button:hover:not(:disabled) {
		color: var(--text);
		background: var(--surface-3);
	}

	button.primary {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
		font-weight: 600;
	}

	button.primary:hover:not(:disabled) {
		background: #6ad68d;
		border-color: #6ad68d;
	}

	.notes {
		margin: var(--gap-3) 0 0;
		padding-left: 18px;
		font-size: var(--fs-md);
		color: var(--warn);
	}

	.bad {
		margin: var(--gap-3) 0 0;
		font-size: var(--fs-md);
		color: var(--danger);
	}

	.empty {
		margin: var(--gap-6) 0;
		font-size: var(--fs-md);
		color: var(--text-faint);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		margin: var(--gap-6) 0 var(--gap-2);
		font-size: var(--fs-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}

	.count {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0;
		color: var(--text-faint);
		background: var(--surface-2);
		border-radius: 999px;
		padding: 1px 6px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-3);
		padding: 7px var(--gap-3);
		border-bottom: 1px solid var(--line);
	}

	li:last-child {
		border-bottom: none;
	}

	li:hover {
		background: var(--surface);
	}

	li a {
		display: flex;
		align-items: baseline;
		gap: var(--gap-3);
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.slug {
		font-family: var(--font-mono);
		font-size: var(--fs-md);
		color: var(--text);
		white-space: nowrap;
	}

	.title {
		font-size: var(--fs-md);
		color: var(--text-dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flags {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
		flex-shrink: 0;
	}

	.badge {
		font-size: var(--fs-xs);
		padding: 1px 6px;
		border-radius: 4px;
		color: var(--text-dim);
		background: var(--surface-2);
	}

	.badge.warn {
		color: var(--warn);
		background: var(--warn-wash);
	}

	.langs {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
