import type { EventLogParams } from "@/types/log";
import type { Prisma } from "@prisma/client";

export async function persistToDatabase(params: EventLogParams): Promise<void> {
	const { prisma } = await import("@/lib/prisma");

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
