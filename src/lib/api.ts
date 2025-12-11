"use server";

import { cookies } from "next/headers";

export async function makeApiCall<T = unknown>(endpoint: string, apiType: "api" | "sap", params?: Record<string, string>): Promise<T> {
	let baseUrl: string;
	let username: string;
	let password: string;

	if (apiType === "api") {
		baseUrl = process.env.API_URL!;
		username = process.env.API_USERNAME!;
		password = process.env.API_PASSWORD!;
	} else {
		baseUrl = process.env.SAP_URL!;
		username = process.env.DFS_USERNAME!;
		password = process.env.DFS_PASSWORD!;
	}

	const cookieStore = await cookies();
	const requestId = cookieStore.get("requestId")?.value;

	if (!baseUrl || !username || !password) {
		throw new Error(`${apiType.toUpperCase()} API credentials not configured`);
	}

	const url = new URL(`${baseUrl}${endpoint}`);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});
	}

	const headers = new Headers();
	headers.set("Authorization", "Basic " + btoa(username + ":" + password));

	const response = await fetch(url.toString(), { method: "GET", headers });

	const { default: log } = await import("@/services/log");
	log.api({ action: "test", method: "GET", url: url.href, message: `API call to ${baseUrl}`, status: response.status, requestId });

	if (!response.ok && response.status === 404) return { error: response.status, message: "resource not found" } as T;
	if (!response.ok) throw new Error(`API request failed: ${response.status}`);

	return await response.json();
}
