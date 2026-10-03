import { json } from "@sveltejs/kit";
import {
	fetchReadme,
	fetchRepoMeta,
	firstParagraph,
	humanize,
	parseRepoUrl,
	pickReadmeImage,
	rawBaseFor,
	readmeImageUrls,
	repoUrl,
	slugifyRepoName,
} from "$lib/server/github";
import { saveImage } from "$lib/server/images";
import { createProjectPlaceholder } from "$lib/server/placeholder";
import type { RequestHandler } from "./$types";

export interface GitHubProjectPayload {
	slug: string;
	frontmatter: Record<string, unknown>;
	body: string;
	imageFrom: "readme" | "placeholder";
	language: string | null;
	archived: boolean;
	notes: string[];
}

export const POST: RequestHandler = async ({ request }) => {
	let url = "";
	let wantImage = true;
	try {
		const body = (await request.json()) as { url?: unknown; image?: unknown };
		if (typeof body?.url === "string") url = body.url;
		if (typeof body?.image === "boolean") wantImage = body.image;
	} catch {
		return json({ error: "Ожидался JSON с полем url" }, { status: 400 });
	}

	const ref = parseRepoUrl(url);
	if (!ref) {
		return json(
			{ error: "Не разобрал ссылку. Вид: https://github.com/owner/name" },
			{ status: 400 },
		);
	}

	try {
		const meta = await fetchRepoMeta(ref);
		const notes: string[] = [];

		const readme = await fetchReadme(ref).catch(() => {
			notes.push("README не прочитался");
			return "";
		});

		const frontmatter: Record<string, unknown> = {
			title: humanize(meta.name),
			repo: repoUrl(ref),
		};
		if (meta.description) frontmatter.description = meta.description;
		else notes.push("описания на GitHub нет — заполни вручную");
		if (meta.homepage) frontmatter.homepage = meta.homepage;
		if (meta.topics.length > 0) frontmatter.tags = meta.topics;
		if (meta.archived) notes.push("репозиторий помечен как архивный");

		const body = firstParagraph(readme);
		if (!body) notes.push("первый абзац README не нашёлся");

		const slug = slugifyRepoName(meta.name);
		if (slug !== meta.name) {
			notes.push(`имя репозитория приводится к slug «${slug}»`);
		}

		let imageFrom: GitHubProjectPayload["imageFrom"] = "placeholder";
		if (slug && wantImage) {
			const urls = readmeImageUrls(readme, rawBaseFor(ref, meta.defaultBranch));
			const { image, rejected } = await pickReadmeImage(urls);

			if (image) {
				const saved = await saveImage({
					buffer: image.buffer,
					mimeType: image.mimeType,
					kind: "banner",
					slug,
				});
				frontmatter.image = saved.path;
				imageFrom = "readme";
			} else {
				frontmatter.image = (
					await createProjectPlaceholder(meta.name, slug)
				).path;
				const first = rejected[0];
				if (first) {
					notes.push(
						first.width > 0
							? `картинка в README ${first.width}×${first.height} — мелкая для обложки`
							: "картинку из README скачать не удалось",
					);
				}
			}
		}

		const payload: GitHubProjectPayload = {
			slug,
			frontmatter,
			body,
			imageFrom,
			language: meta.language,
			archived: meta.archived,
			notes,
		};
		return json(payload);
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 502 });
	}
};
