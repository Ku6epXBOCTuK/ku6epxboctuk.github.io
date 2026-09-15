<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browserLang } from "$lib/content";

	onMount(() => {
		const path = location.pathname.replace(/\/+$/, "");
		void goto(`/${browserLang()}${path}`, { replaceState: true });
	});
</script>
