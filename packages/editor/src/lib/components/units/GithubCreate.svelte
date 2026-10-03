<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		defaultsFor,
		entryFromFlat,
	} from "@ku6epxboctuk/content-core/shared";
	import type { GitHubProjectPayload } from "../../../routes/api/github-project/+server";
	import Button from "../ui/Button.svelte";
	import TextInput from "../ui/TextInput.svelte";

	let creating = $state(false);
	let errorText = $state("");
	let ghUrl = $state("");
	let ghNotes = $state<string[]>([]);

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
			const json = (await res.json().catch(() => ({}))) as
				(GitHubProjectPayload & { error?: string }) | { error?: string };
			if (!res.ok || !("frontmatter" in json)) {
				errorText = (json as { error?: string }).error ?? `HTTP ${res.status}`;
				return;
			}

			ghNotes = json.notes ?? [];

			const entry = entryFromFlat("project", json.slug, {
				...defaultsFor("project"),
				...json.frontmatter,
			});
			entry.versions.ru.body = json.body ?? "";

			const created = await fetch(`/api/entries/project/${json.slug}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(entry),
			});
			if (!created.ok) {
				errorText =
					((await created.json().catch(() => ({}))) as { error?: string })
						.error ?? `HTTP ${created.status}`;
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
		onclick={createFromGithub}>{creating ? "создаю…" : "создать"}</Button
	>
</div>

{#if creating}
	<p class="progress">
		Тяну данные с GitHub — с картинкой это может занять десяток секунд.
	</p>
{/if}

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

<style>
	.gh {
		display: flex;
		align-items: center;
		gap: var(--gap-2);
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

	.progress {
		margin: var(--gap-2) 0 0;
		font-size: var(--fs-md);
		color: var(--text-dim);
	}

	.notes {
		margin: var(--gap-2) 0 0;
		padding-left: var(--gap-4);
		font-size: var(--fs-md);
		color: var(--warn);
	}

	.bad {
		margin: var(--gap-2) 0 0;
		font-size: var(--fs-md);
		color: var(--danger);
	}
</style>
