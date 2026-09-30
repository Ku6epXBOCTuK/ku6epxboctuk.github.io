// @vitest-environment node

import { describe, expect, it } from "vitest";
import { hasValidToken, isLoopbackHost, isSameOrigin } from "./auth.ts";
import { readToken } from "./token.ts";

function event(headers: Record<string, string>, cookieValue?: string) {
	return {
		request: { headers: new Headers(headers) },
		cookies: { get: () => cookieValue },
	} as unknown as Parameters<typeof hasValidToken>[0];
}

function request(headers: Record<string, string>, host = "127.0.0.1:4321") {
	return {
		request: { headers: new Headers({ host, ...headers }) },
		cookies: { get: () => undefined },
	} as unknown as Parameters<typeof isSameOrigin>[0];
}

describe("isLoopbackHost", () => {
	it.each([
		["127.0.0.1:4321", true],
		["localhost:4321", true],
		["127.0.0.1", true],
		["[::1]:4321", true],
		["evil.com", false],
		["127.0.0.1.evil.com", false],
		["10.0.0.5:4321", false],
		["", false],
	])("%s", (host, expected) => {
		expect(isLoopbackHost(host)).toBe(expected);
	});
});

describe("isSameOrigin", () => {
	it("пропускает запрос без Origin", () => {
		expect(isSameOrigin(request({}))).toBe(true);
	});

	it("пропускает совпадающий Origin", () => {
		expect(isSameOrigin(request({ origin: "http://127.0.0.1:4321" }))).toBe(
			true,
		);
	});

	it("режет чужой Origin", () => {
		expect(isSameOrigin(request({ origin: "https://evil.com" }))).toBe(false);
	});

	it("режет битый Origin", () => {
		expect(isSameOrigin(request({ origin: "http://" }))).toBe(false);
	});

	it.each([
		["same-origin", true],
		["none", true],
		["cross-site", false],
		["same-site", false],
	])("Sec-Fetch-Site: %s", (site, expected) => {
		expect(isSameOrigin(request({ "sec-fetch-site": site }))).toBe(expected);
	});
});

describe("hasValidToken", () => {
	const token = readToken();

	it("принимает верный токен в заголовке", () => {
		expect(hasValidToken(event({ "x-editor-token": token }))).toBe(true);
	});

	it("принимает верную куку", () => {
		expect(hasValidToken(event({}, token))).toBe(true);
	});

	it("отклоняет подделанную куку", () => {
		expect(hasValidToken(event({}, "deadbeef"))).toBe(false);
	});

	it("отклоняет куку не той длины", () => {
		expect(hasValidToken(event({}, token.slice(0, 8)))).toBe(false);
	});

	it("отклоняет запрос без токена", () => {
		expect(hasValidToken(event({}))).toBe(false);
	});
});
