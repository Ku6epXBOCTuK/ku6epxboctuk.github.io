<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		defaultsFor,
		draftSlug,
		entryFromFlat,
		type ContentType,
		type Entry,
	} from "@ku6epxboctuk/content-core/shared";
	import type { GitHubProjectPayload } from "../../../routes/api/github-project/+server";
	import Button from "../ui/Button.svelte";
	import TextInput from "../ui/TextInput.svelte";

	/*
	 * Панель создания: пустые единицы трёх типов и проект из GitHub-репозитория.
	 * Вся логика создания — здесь, страница только показывает список.
	 */

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

	async function createEntry(type: ContentType, slug: string, entry: Entry) {
		const res = await fetch(`/api/entries/${type}/${slug}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(entry),
		});
		if (!res.ok) {
			errorText =
				((await readJson(res)) as { error?: string }).error ??
				`HTTP ${res.status}`;
			return false;
		}
		await goto(`/${type}/${slug}`);
		return true;
	}

	async function createPlain(type: ContentType) {
		const slug = draftSlug(type);
		creating = true;
		errorText = "";
		try {
			// `defaultsFor` отдаёт плоскую карту; корзины расставляет `scope`.
			await createEntry(
				type,
				slug,
				entryFromFlat(type, slug, defaultsFor(type)),
			);
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

			// GitHub присылает поля вперемешку, `scope` раскладывает их по корзинам.
			const entry = entryFromFlat("project", json.slug, {
				...defaultsFor("project"),
				...json.frontmatter,
			});
			entry.versions.ru.body = json.body ?? "";

			await createEntry("project", json.slug, entry);
		} catch (err) {
			errorText = (err as Error).message;
		} finally {
			creating = false;
		}
	}
</script>

<section class="create">
	<div class="row">
		<Button disabled={creating} onclick={() => createPlain("post")}>пост</Button
		>
		<Button disabled={creating} onclick={() => createPlain("article")}
			>статья</Button
		>
		<Button disabled={creating} onclick={() => createPlain("project")}
			>пустой проект</Button
		>
		<span class="sep" aria-hidden="true"></span>
		<div class="gh">
			<span class="gh-label">из github</span>
			<TextInput
				mono
				bind:value={ghUrl}
				placeholder="owner/name"
				onkeydown={(e) => e.key === "Enter" && createFromGithub()}
			/>
			<Button
				variant="primary"
				disabled={creating || !ghUrl.trim()}
				onclick={createFromGithub}>создать</Button
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

	.gh :global(input) {
		flex: 1 1 140px;
		min-width: 0;
		font-size: var(--fs-sm);
	}

	.gh-label {
		font-size: var(--fs-md);
		color: var(--text-faint);
		white-space: nowrap;
	}

	.notes {
		margin: var(--gap-3) 0 0;
		padding-left: var(--gap-4);
		font-size: var(--fs-md);
		color: var(--warn);
	}

	.bad {
		margin: var(--gap-3) 0 0;
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
