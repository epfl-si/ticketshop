"use server";
import { ApiUser } from "@/types";
import { makeApiCall } from "../lib/api";

const searchCache = new Map<string, { data: ApiUser[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function searchUsers(query: string): Promise<ApiUser[]> {
	const searchTerm = query.toLowerCase().trim();

	if (searchTerm.length < 3) {
		return [];
	}

	const now = Date.now();
	const cached = searchCache.get(searchTerm);

	if (cached && (now - cached.timestamp) < CACHE_DURATION) {
		return cached.data;
	}

	const data = await makeApiCall<{ persons: ApiUser[] }>("/v1/persons", "api", {
		query: query,
		pagesize: "10",
		pageindex: "0",
	});

	const result = data.persons || [];

	searchCache.set(searchTerm, {
		data: result,
		timestamp: now,
	});

	if (searchCache.size > 50) {
		const cutoff = now - CACHE_DURATION;
		for (const [key, value] of searchCache.entries()) {
			if (value.timestamp < cutoff) {
				searchCache.delete(key);
			}
		}
	}

	return result;
}

export async function getUserById(userId: string): Promise<ApiUser | null> {
	try {
		const data = await makeApiCall<{ persons: ApiUser[] }>("/v1/persons", "api", {
			query: userId,
			pagesize: "1",
			pageindex: "0",
		});

		const users = data.persons || [];
		const user = users.find(u => u.id === userId);
		if (!user) return null;

		return {
			...user,
			name: `${user.firstname} ${user.lastname}`,
		};
	} catch (error) {
		console.error("Error fetching user by ID:", error);
		return null;
	}
}
