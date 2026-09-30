import { timingSafeEqual } from "node:crypto";
import type { RequestEvent } from "@sveltejs/kit";
import { readToken } from "./token.ts";

export const COOKIE = "editor_token";

const LOOPBACK = ["127.0.0.1", "localhost", "[::1]"];

function safeEqual(a: string, b: string): boolean {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export function isLoopbackHost(host: string | null): boolean {
	if (!host) return false;
	const name = host.replace(/:\d+$/, "");
	return LOOPBACK.includes(name);
}

/**
 * Браузер с чужой страницы может сделать blind-запрос на 127.0.0.1, пока
 * пользователь авторизован. Origin и Sec-Fetch-Site это отсекают.
 */
export function isSameOrigin(event: RequestEvent): boolean {
	const origin = event.request.headers.get("origin");
	if (origin) {
		const host = event.request.headers.get("host");
		try {
			if (new URL(origin).host !== host) return false;
		} catch {
			return false;
		}
	}

	const site = event.request.headers.get("sec-fetch-site");
	if (site && site !== "same-origin" && site !== "none") return false;

	return true;
}

export function hasValidToken(event: RequestEvent): boolean {
	const header = event.request.headers.get("x-editor-token");
	const cookie = event.cookies.get(COOKIE);
	const provided = header ?? cookie;
	if (!provided) return false;
	return safeEqual(provided, readToken());
}
