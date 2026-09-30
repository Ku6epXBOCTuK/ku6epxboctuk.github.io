import { redirect, type Handle } from "@sveltejs/kit";
import {
	COOKIE,
	hasValidToken,
	isLoopbackHost,
	isSameOrigin,
} from "$lib/server/auth.ts";
import { readToken } from "$lib/server/token.ts";

const AUTH_PATH = "/auth";

const SEE_OTHER = 303;

export const handle: Handle = async ({ event, resolve }) => {
	if (!isLoopbackHost(event.request.headers.get("host"))) {
		return new Response("forbidden host", { status: 403 });
	}

	if (!isSameOrigin(event)) {
		return new Response("forbidden origin", { status: 403 });
	}

	const url = event.url;

	if (url.pathname === AUTH_PATH) {
		const token = readToken();
		if ((url.searchParams.get("t") ?? "") !== token) {
			return new Response("bad token", { status: 401 });
		}
		event.cookies.set(COOKIE, token, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
		});
		redirect(SEE_OTHER, url.searchParams.get("next") ?? "/");
	}

	if (hasValidToken(event)) return resolve(event);

	return new Response("editor: открой ссылку из терминала", { status: 401 });
};
