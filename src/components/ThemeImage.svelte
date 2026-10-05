<script lang="ts">
	interface Props {
		src: string;
		alt: string;
	}

	let { src, alt }: Props = $props();

	const darkSrc = $derived(
		src.endsWith(".light.webp")
			? src.replace(".light.webp", ".dark.webp")
			: src,
	);
</script>

<div class="theme-image">
	<img class="variant-light" {src} {alt} loading="lazy" decoding="async" />
	<img
		class="variant-dark"
		src={darkSrc}
		alt=""
		aria-hidden="true"
		loading="lazy"
		decoding="async"
	/>
</div>

<style>
	.theme-image {
		position: relative;
	}

	.theme-image img {
		width: 100%;
		display: block;
		transition: opacity 0.3s ease;
	}

	.variant-dark {
		position: absolute;
		inset: 0;
		opacity: 0;
	}

	:global(html.dark) .variant-dark {
		opacity: 1;
	}

	:global(html.dark) .variant-light {
		opacity: 0;
	}
</style>
