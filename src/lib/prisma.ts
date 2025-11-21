import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
	pool: Pool | undefined;
};

function getPrismaClient() {
	if (globalForPrisma.prisma) return globalForPrisma.prisma;

	const connectionString = process.env.DATABASE_URL;
	const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

	if (!connectionString) {
		if (isBuildTime) {
			const mockClient = {} as PrismaClient;
			globalForPrisma.prisma = mockClient;
			return mockClient;
		}
		throw new Error("DATABASE_URL environment variable is not defined");
	}

	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	const client = new PrismaClient({ adapter });

	if (process.env.NODE_ENV !== "production") {
		globalForPrisma.prisma = client;
		globalForPrisma.pool = pool;
	}

	return client;
}

export const prisma = new Proxy({} as PrismaClient, {
	get: (target, prop) => {
		const client = getPrismaClient();
		return client[prop as keyof PrismaClient];
	},
});
