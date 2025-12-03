"use server";

import type { GetLogsParams } from "@/types/log";
import { prisma } from "@/lib/prisma";

export async function getLogs(params: GetLogsParams = {}) {
	const { limit = 100, offset = 0, event: eventFilter, userId, targetId } = params;
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

	if (targetId) {
		const dbUser = await prisma.user.findUnique({
			where: { uniqueId: targetId },
			select: { uniqueId: true },
		});
		if (dbUser) {
			// where.metadata = {
			// 	target: dbUser.uniqueId
			// };
			where.metadata = {
				path: ["target"],
				equals: dbUser.uniqueId,
			};
		} else if (targetId) {
			where.metadata = {
				path: ["target"],
				equals: targetId,
			};
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
