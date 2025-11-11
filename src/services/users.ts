"use server";
import { ApiUser } from "@/types";
import { makeApiCall } from "../lib/api";
import { getCache, setCache } from "../lib/redis";
import { getUser } from "@/services/auth";
import { hasPermission } from "@/services/policy";
import { PERMISSIONS } from "@/constants/permissions";

export async function getAllUsers(): Promise<{ i: string; e: string; f: string; l: string; d: string; n: string; m: string; }[]> {
	try {
		const user = await getUser();
		if (!user) return [];

		const permission = await hasPermission(PERMISSIONS.FUNDS.LIST) || await hasPermission(PERMISSIONS.TRAVELS.LIST);
		if (!permission) return [];

		const rawUsers = await getCache("users:all");
		if (!rawUsers) return [];

		return JSON.parse(rawUsers);
	} catch (error) {
		console.error("Error getting users from cache:", error);
		return [];
	}
}

export async function searchUsers(query: string): Promise<ApiUser[]> {
	const searchTerm = query.toLowerCase().trim();

	if (searchTerm.length < 3) {
		return [];
	}

	try {
		const data = await makeApiCall<{ persons: ApiUser[] }>("/v1/persons", "api", {
			query: query,
			pagesize: "10",
			pageindex: "0",
		});

		const result = data.persons || [];

		return result.map(user => ({
			...user,
			name: (user.firstname && user.lastname) ? `${user.firstname} ${user.lastname}` : user.display,
		}));

	} catch (error) {
		console.error("Error searching users:", error);
		return [];
	}
}

export async function reloadUsersCache(): Promise<{ success: boolean; count?: number; error?: string }> {
	try {
		const data = await makeApiCall<{ persons: ApiUser[] }>("/v1/persons?isaccredited=1", "api");
		const users = data.persons || [];

		const enrichedUsers = users.map(user => {
			const fullName = (user.firstname && user.lastname) ? `${user.firstname} ${user.lastname}` : user.display;
			return {
				i: user.id,
				e: user.email || "",
				f: user.firstname || "",
				l: user.lastname || "",
				d: user.display || "",
				n: fullName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase(),
				m: fullName,
			};
		});

		const jsonData = JSON.stringify(enrichedUsers);
		await setCache("users:all", jsonData, 2592000); // 30 days TTL

		return {
			success: true,
			count: enrichedUsers.length,
		};

	} catch (error) {
		console.error("Error reloading cache:", error);
		return { success: false, error: "Error reloading cache" };
	}
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
