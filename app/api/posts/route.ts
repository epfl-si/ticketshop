import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const posts = await prisma.post.findMany();
    return new Response(JSON.stringify(posts), {
        headers: { 'content-type': 'application/json' },
    });
}

export async function POST(request: Request) {
    const post = await prisma.post.create({
        data: { title: 'Hello, World!', content: 'This is my first post.' },
    });
    return new Response(JSON.stringify(post), {
        headers: { 'content-type': 'application/json' },
    });
}