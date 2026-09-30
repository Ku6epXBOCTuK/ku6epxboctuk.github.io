<script lang="ts">
	interface Props {
		value: string;
		disabled?: boolean;
		onchange: (value: string) => void;
	}

	let { value, disabled = false, onchange }: Props = $props();
</script>

<div class="image">
	<input
		type="text"
		{disabled}
		{value}
		placeholder="/images/oblozhka.webp"
		oninput={(e) => onchange(e.currentTarget.value)}
	/>
	<span class="note">
		Абсолютный путь от корня сайта. Файл лежит в <code>static/images</code>.
		Загрузка через drag&nbsp;drop появится в следующем шаге.
	</span>
	{#if value}
		<img src={value} alt="предпросмотр обложки" />
	{/if}
</div>

<style>
	.image {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input {
		font: inherit;
		padding: 7px 9px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	.note {
		font-size: 11px;
		color: #777;
	}

	img {
		max-width: 100%;
		max-height: 180px;
		border: 1px solid #ddd;
		border-radius: 5px;
	}
</style>
