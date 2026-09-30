<script lang="ts">
	import {
		CONTENT_TYPES,
		type UnitSummary,
	} from "@ku6epxboctuk/content-core/shared";

	let units = $state<UnitSummary[]>([]);
	let error = $state("");
	let loading = $state(true);

	$effect(() => {
		void (async () => {
			try {
				const res = await fetch("/api/units");
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				units = await res.json();
			} catch (err) {
				error = (err as Error).message;
			} finally {
				loading = false;
			}
		})();
	});
</script>

<h1>Единицы контента</h1>

{#if loading}
	<p class="note">загрузка…</p>
{:else if error}
	<p class="error">{error}</p>
{:else if units.length === 0}
	<p class="note">
		Пока пусто. Создай первую единицу — форма появится в следующем шаге.
	</p>
{:else}
	{#each CONTENT_TYPES as type (type)}
		{@const group = units.filter((unit) => unit.type === type)}
		{#if group.length > 0}
			<h2>{type}</h2>
			<ul>
				{#each group as unit (unit.slug)}
					<li>
						<span class="slug">{unit.slug}</span>
						{#if unit.draft}<span class="badge">черновик</span>{/if}
						{#if unit.needsTranslation}
							<span class="badge warn">нужен перевод</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
{/if}

<style>
	h1 {
		font-size: 20px;
		margin: 0 0 20px;
	}

	h2 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: #666;
		margin: 28px 0 10px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
	}

	.slug {
		font-weight: 600;
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

	.note {
		color: #666;
	}

	.error {
		color: #b00020;
	}
</style>
