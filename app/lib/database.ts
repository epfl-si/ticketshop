'use server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateSetting(shownValue: boolean, settingId: number) {
    return await prisma.settings.update({
        where: { id: settingId },
        data: {
            shown: shownValue
        },
    });
}

export async function getUser(sciper: string) {
    const dbUser = await prisma.users.findUnique({
        where: { sciper: parseInt(sciper) },
        include: { dfs: true, funds: true, settings: true },
    });

    return dbUser;
}