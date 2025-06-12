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