<script lang="ts">
	import { page } from "$app/state";
	import UnitForm from "$lib/components/UnitForm.svelte";

	const data = $derived(page.data);
</script>

<UnitForm type={data.type} slug={data.slug} detail={data.detail} />
