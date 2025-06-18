import { auth } from './auth'
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const session = await auth();

	if (!session?.user) {
		const authUrl = new URL('/api/auth', req.url);
		authUrl.searchParams.set('callbackUrl', req.url);
		return NextResponse.redirect(authUrl);
	}

	try {
        if (pathname === '/search' && !session.user.isAdmin) {
            return NextResponse.rewrite(new URL('/not-found', req.url));
        }

		return NextResponse.next();
	} catch (error) {
		console.error('Erreur middleware:', error);
		return new NextResponse(null, { status: 500 });
	}
}

export const config = {
	matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z]+$).*)'],
};
