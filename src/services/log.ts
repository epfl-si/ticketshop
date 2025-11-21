import type { Prisma } from "@prisma/client";
import type { WebLogParams, ApiLogParams, SoapLogParams, DatabaseLogParams, EventLogParams, BaseLogParams } from "@/types/log";
import { prisma } from "@/lib/prisma";

async function logToConsole(params: Record<string, unknown>): Promise<void> {
	const filtered = Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
	);

	if (filtered.user && typeof filtered.user === "object") {
		const user = filtered.user as Record<string, unknown>;
		filtered.user = {
			name: user.name,
			groups: user.groups,
			userId: user.userId,
		};
	}

	console.info(JSON.stringify(filtered));
}

async function persistToDatabase(params: EventLogParams): Promise<void> {
	try {
		const userIdValue = params.userId || params.user?.userId;
		let dbUserId: string | null = null;

		if (userIdValue) {
			const dbUser = await prisma.user.findUnique({
				where: { uniqueId: userIdValue },
				select: { id: true },
			});
			dbUserId = dbUser?.id || null;
		}

		await prisma.log.create({
			data: {
				event: params.event,
				userId: dbUserId,
				details: params.details || params.message || null,
				metadata: (params.metadata as Prisma.InputJsonValue) ?? null,
			},
		});
	} catch (error) {
		console.error("Failed to persist event to database:", error);
	}
}

async function log(params: BaseLogParams & Record<string, unknown>): Promise<void> {
	await logToConsole(params);

	if (params.persist && params.type === "event") {
		await persistToDatabase(params as unknown as EventLogParams);
	}
}

const web = (params: WebLogParams) => log({ type: "web", ...params });
const api = (params: ApiLogParams) => log({ type: "api", ...params });
const soap = (params: SoapLogParams) => log({ type: "soap", ...params });
const database = (params: DatabaseLogParams) => log({ type: "database", ...params });

const event = (params: EventLogParams) =>
	log({
		type: "event",
		...params,
		persist: true,
		username: params.user?.username,
	});

const logger = { web, api, soap, database, event };

export default logger;
