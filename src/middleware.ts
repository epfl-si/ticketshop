import { NextRequest, NextResponse } from "next/server";
import { auth } from "./services/auth";
import { hasPermission } from "./services/policy";
import { PROTECTED_ROUTES } from "./constants/permissions";

import log from "@/services/log";
import { Session } from "next-auth";

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const search = req.nextUrl.search;
	const endpoint = pathname + search;
	const ip = req.headers.get("x-forwarded-for") || null;

	const requestId: string = crypto.randomUUID();
	let session: Session | null = null;

	session = await auth();

	if (pathname === "/") {
		log.web({ user: session?.user, ip, endpoint, requestId, method: req.method });
		return NextResponse.next();
	}

	if (!Object.values(PROTECTED_ROUTES).map(route => String(route.PATH)).includes(pathname)) {
		log.web({ user: session?.user, ip, endpoint, requestId, method: req.method });
		return NextResponse.rewrite(new URL("/not-found", req.url));
	}

	if (!session?.user) {
		const authUrl = new URL("/api/auth", req.url);
		log.web({ user: session?.user, ip, endpoint, requestId, method: req.method });
		authUrl.searchParams.set("callbackUrl", req.url);
		return NextResponse.redirect(authUrl);
	}

	try {
		for (const route of Object.values(PROTECTED_ROUTES)) {
			if (pathname.startsWith(route.PATH)) {
				for (const permission of route.PERMISSIONS) {
					const hasPerm = await hasPermission(permission);
					if (!hasPerm) {
						log.web({ user: session?.user, ip, endpoint, requestId, method: req.method });
						return NextResponse.rewrite(new URL(route.REWRITE || "/not-found", req.url));
					}
				}
			}
		}

		const response: NextResponse = NextResponse.next();

		response.cookies.set("requestId", requestId, {
			path: "/",
			maxAge: 60,
		});

		log.web({ user: session?.user, ip, endpoint, requestId, method: req.method });

		return response;
	} catch (error) {
		console.error("Erreur middleware:", error);
		log.web({ ip, endpoint, requestId, message: `middleware error: ${error}` });
		return new NextResponse(null, { status: 500 });
	}
}

export const config = {
	matcher: ["/((?!api/auth|api/artifactServer|api/reload|cgi-bin/artifactServer|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z]+$).*)"],
};
