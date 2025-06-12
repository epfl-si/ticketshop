import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { sciper: string } }) {
    const { sciper } = await params;

    const dbUser = await prisma.users.findUnique({
        where: { sciper: parseInt(sciper) },
        include: { dfs: true, funds: true, settings: true },
    });

    return new Response(JSON.stringify(dbUser), {
        headers: { 'content-type': 'application/json' },
        status: dbUser ? 200 : 404,
    });
}