import type { EventLogParams, GetLogsParams, LogEntry, LogMetadata } from "@/types/log";
import type { Prisma } from "@prisma/client";

export async function persistToDatabase(params: EventLogParams): Promise<void> {
	const { prisma } = await import("@/lib/prisma");

	try {
		const sciper = params.userId;
		let dbUserId: string | undefined;

		if (sciper) {
			const dbUser = await prisma.user.findUnique({
				where: { uniqueId: sciper },
				select: { id: true },
			});
			dbUserId = dbUser?.id;
		}

		await prisma.log.create({
			data: {
				event: params.event,
				userId: dbUserId,
				details: params.details ?? params.message ?? "",
				metadata: (params.metadata as Prisma.InputJsonValue) ?? {},
			},
		});
	} catch (error) {
		console.error("Failed to persist event to database:", error);
	}
}

async function getSciperFromEmail(email: string): Promise<string | undefined> {
	const { getPersonByEmail } = await import("@/services/artifact");
	const persons = await getPersonByEmail(email);
	return persons?.[0]?.id;
}

export async function getLogs(params: GetLogsParams = {}): Promise<{ logs: LogEntry[]; total: number }> {
	const { prisma } = await import("@/lib/prisma");
	const { limit = 100, offset = 0, event: eventFilter, search } = params;
	const where: Prisma.LogWhereInput = {};

	if (eventFilter) {
		where.event = eventFilter;
	}

	if (search) {
		const searchTerm = search.trim();
		const isSciper = /^\d+$/.test(searchTerm);
		const isEmail = searchTerm.includes("@");

		if (isSciper) {
			where.OR = [
				{ user: { uniqueId: searchTerm } },
				{ metadata: { path: ["sciper"], equals: searchTerm } },
				{ metadata: { path: ["targetSciper"], equals: searchTerm } },
				{ metadata: { path: ["adminSciper"], equals: searchTerm } },
			];
		} else if (isEmail) {
			const sciper = await getSciperFromEmail(searchTerm);
			if (sciper) {
				where.OR = [
					{ user: { uniqueId: sciper } },
					{ metadata: { path: ["sciper"], equals: sciper } },
					{ metadata: { path: ["targetSciper"], equals: sciper } },
					{ metadata: { path: ["email"], string_contains: searchTerm } },
				];
			} else {
				where.metadata = { path: ["email"], string_contains: searchTerm };
			}
		} else {
			where.details = { contains: searchTerm, mode: "insensitive" };
		}
	}

	const [logs, total] = await Promise.all([
		prisma.log.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
			include: {
				user: {
					select: { uniqueId: true },
				},
			},
		}),
		prisma.log.count({ where }),
	]);

	const mappedLogs: LogEntry[] = logs.map((log) => ({
		id: log.id,
		createdAt: log.createdAt,
		event: log.event,
		details: log.details ?? "",
		metadata: (log.metadata as LogMetadata) ?? {},
		user: log.user ?? { uniqueId: "" },
	}));

	return { logs: mappedLogs, total };
}
