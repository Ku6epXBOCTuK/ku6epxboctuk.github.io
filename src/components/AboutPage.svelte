<div class="section-title">about</div>

<div class="about-text">
	<p>
		developer based in middle of Russia. frontend-leaning — svelte, rust, tauri,
		creative coding, and polished interfaces.
	</p>
	<p>
		it started in school — installing and configuring software, then diving into
		programming. wrote my first programs in pascal abc and later implemented
		modbus rtu protocol on atmega328.
	</p>
	<p>
		since 2016 i've been doing freelance (html/css/js/wordpress), then 2018-2019
		— built a ui kit on react for an hr analytics company. from 2019 worked on
		internal tools for a us-based provider using svelte 3.
	</p>
	<p>
		from 2023 to march 2026 i worked on a desktop app project — svelte + rust +
		tauri. the project is now complete and i'm open to new opportunities.
	</p>
	<p>
		when not coding: sleeping, generative art, writing, and going down rabbit
		holes on obscure tech topics.
	</p>
</div>

<div class="section-title" style="margin-top: 40px">skills</div>
<table class="skills-table">
	<tbody>
		<tr><td>frontend</td><td>svelte, rust, tauri, typescript</td></tr>
		<tr
			><td>creative</td><td>three.js, pixi.js, webgl, glsl, canvas, shaders</td
			></tr
		>
		<tr><td>backend</td><td>rust, sql, wasm, node</td></tr>
		<tr><td>infra</td><td>cloud, docker, ci/cd</td></tr>
		<tr><td>design</td><td>figma, ui/ux, design systems</td></tr>
	</tbody>
</table>

<div class="section-title" style="margin-top: 40px">experience</div>

<div class="exp-item">
	<div class="exp-header">
		<span class="exp-role">svelte + rust + tauri</span>
		<span class="exp-date">2023 — mar 2026</span>
	</div>
	<div class="exp-company">product project</div>
	<div class="exp-desc">software-hardware solution. project completed.</div>
</div>

<div class="exp-item">
	<div class="exp-header">
		<span class="exp-role">frontend developer</span>
		<span class="exp-date">2019 — 2023</span>
	</div>
	<div class="exp-company">hosting provider</div>
	<div class="exp-desc">
		built admin panel for hosting and domain management on svelte 3.
	</div>
</div>

<div class="exp-item">
	<div class="exp-header">
		<span class="exp-role">frontend developer</span>
		<span class="exp-date">2018 — 2019</span>
	</div>
	<div class="exp-company">hr analytics company</div>
	<div class="exp-desc">created ui kit on react.</div>
</div>

<div class="exp-item">
	<div class="exp-header">
		<span class="exp-role">freelance developer</span>
		<span class="exp-date">2016 — 2018</span>
	</div>
	<div class="exp-company">freelance</div>
	<div class="exp-desc">
		html, css, js, wordpress — sites for local businesses.
	</div>
</div>

<div class="exp-item">
	<div class="exp-header">
		<span class="exp-role">programming</span>
		<span class="exp-date">school</span>
	</div>
	<div class="exp-company">self-taught</div>
	<div class="exp-desc">
		pascal abc, modbus rtu on atmega328, software installation & configuration.
	</div>
</div>

<style>
	.section-title {
		color: var(--accent);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 24px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}

	.section-title::before {
		content: "# ";
		color: var(--dim);
	}

	.about-text {
		margin: 20px 0;
		color: var(--fg);
	}

	.about-text p {
		margin-bottom: 16px;
	}

	.skills-table {
		width: 100%;
		margin: 30px 0;
		border-collapse: collapse;
	}

	.skills-table td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		font-size: 13px;
	}

	.skills-table td:first-child {
		color: var(--accent3);
		width: 40%;
	}

	.skills-table td:last-child {
		color: var(--fg);
	}

	.exp-item {
		margin: 24px 0;
		padding-left: 16px;
		border-left: 1px solid var(--border);
	}

	.exp-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 4px;
	}

	.exp-role {
		color: var(--fg);
		font-weight: 500;
	}

	.exp-date {
		color: var(--dim);
		font-size: 12px;
	}

	.exp-company {
		color: var(--accent2);
		font-size: 13px;
		margin-bottom: 6px;
	}

	.exp-desc {
		color: var(--dim);
		font-size: 13px;
	}

	@media (max-width: 600px) {
		.exp-header {
			flex-direction: column;
			gap: 2px;
		}
	}
</style>
