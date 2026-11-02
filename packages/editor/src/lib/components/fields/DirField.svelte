<script lang="ts">
	import type { DirEntry } from "@ku6epxboctuk/content-core";
	import Button from "@ku6epxboctuk/ui-kit/components/Button";
	import TextInput from "@ku6epxboctuk/ui-kit/components/TextInput";
	import DirBrowser from "./DirBrowser.svelte";

	interface Listing {
		path: string;
		parent: string | null;
		dirs: DirEntry[];
		roots: string[];
	}

	interface Props {
		id?: string;
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { id = "", value, disabled = false, onchange }: Props = $props();

	let open = $state(false);
	let path = $state("");
	let parent = $state<string | null>(null);
	let dirs = $state<DirEntry[]>([]);
	let roots = $state<string[]>([]);
	let loading = $state(false);
	let error = $state("");

	const current = $derived(value.trim());

	async function load(next?: string) {
		loading = true;
		error = "";
		try {
			const res = await fetch(
				next ? `/api/dirs?path=${encodeURIComponent(next)}` : "/api/dirs",
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as Listing;
			path = data.path;
			parent = data.parent;
			dirs = data.dirs;
			roots = data.roots;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
		}
	}

	async function toggle() {
		open = !open;
		if (open) await load(current || undefined);
	}

	function choose(target: string) {
		onchange(target);
		open = false;
	}
</script>

<div class="dir-field">
	<div class="row">
		<TextInput
			{id}
			style="font-family: var(--ui-font-mono)"
			{disabled}
			{value}
			placeholder="C:\projects\example-repo"
			oninput={(e) => onchange(e.currentTarget.value)}
		/>
		<Button size="sm" {disabled} onclick={toggle}>
			{open ? "закрыть" : "обзор"}
		</Button>
	</div>

	{#if open}
		<DirBrowser
			{path}
			{parent}
			{dirs}
			{roots}
			{loading}
			{error}
			{current}
			{disabled}
			onnavigate={(target) => void load(target)}
			onchoose={choose}
		/>
	{/if}
</div>

<style>
	.dir-field {
		display: flex;
		flex-direction: column;
		gap: var(--ui-space-3);
	}

	.row {
		display: flex;
		gap: var(--ui-space-3);
		align-items: center;
	}
</style>
