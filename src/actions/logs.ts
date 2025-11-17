"use server";

import { PrismaClient } from "@prisma/client";
import type { GetLogsParams } from "@/types/log";

const prisma = new PrismaClient();

export async function getLogs(params: GetLogsParams = {}) {
	const { limit = 100, offset = 0, event: eventFilter, userId } = params;
	const where: Record<string, unknown> = {};

	if (eventFilter) {
		where.event = eventFilter;
	}

	if (userId) {
		const dbUser = await prisma.user.findUnique({
			where: { uniqueId: userId },
			select: { id: true },
		});
		if (dbUser) {
			where.userId = dbUser.id;
		} else {
			return { logs: [], total: 0 };
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

	return { logs, total };
}
