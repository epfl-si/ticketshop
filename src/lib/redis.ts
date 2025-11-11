import { createClient } from "redis";

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
	if (!client || !client.isOpen) {
		if (client) {
			try {
				await client.quit();
			} catch { }
		}

		client = createClient({
			url: process.env.REDIS_URL || "redis://redis:6379",
			socket: {
				keepAlive: true,
				connectTimeout: 5000,
				reconnectStrategy: (retries) => Math.min(retries * 100, 1000),
			},
		});

		client.on("error", () => {
			client = null;
		});
		client.on("end", () => {
			client = null;
		});

		await client.connect();
	}
	return client;
}

export async function setCache(key: string, value: string, ttl = 3600): Promise<void> {
	try {
		const redis = await Promise.race([
			getClient(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Redis connection timeout")), 10000),
			),
		]);

		await redis.setEx(key, ttl, value);
	} catch (error) {
		console.error("Redis set error:", error);
	}
}

export async function getCache(key: string): Promise<string | null> {
	try {
		const redis = await Promise.race([
			getClient(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Redis connection timeout")), 10000),
			),
		]);

		const result = await redis.get(key);
		return result;
	} catch {
		return null;
	}
}
