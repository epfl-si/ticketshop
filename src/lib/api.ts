"use server";

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

	if (!response.ok) throw new Error(`API request failed: ${response.status}`);

	return await response.json();
}
