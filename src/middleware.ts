import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "./services/policy";
import { PROTECTED_ROUTES } from "./constants/permissions";
import { Session } from "next-auth";
import { generateUUID } from "./lib/uuid";
import log from "./services/log";

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const search = req.nextUrl.search;
	const endpoint = pathname + search;
	const ip = req.headers.get("x-forwarded-for") || null;

	const requestId: string = generateUUID();
	let session: Session | null = null;

	const { auth } = await import("./services/auth");
	session = await auth();

	const logWeb = (message?: string) => {
		log.web({
			user: session?.user,
			ip,
			endpoint,
			requestId,
			method: req.method,
			edge: true,
			...(message && { message }),
		});
	};

	if (pathname === "/") {
		logWeb();
		return NextResponse.next();
	}
	if (pathname === "/home") {
		logWeb();
		return NextResponse.rewrite(new URL("/", req.url));
	}
	if (pathname === "/cgi-bin/cff") {
		logWeb();
		return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
	}

	if (!Object.values(PROTECTED_ROUTES).map(route => String(route.PATH)).includes(pathname)) {
		logWeb();
		return NextResponse.rewrite(new URL("/not-found", req.url));
	}

	if (!session?.user) {
		const authUrl = new URL("/api/auth", req.url);
		logWeb();
		authUrl.searchParams.set("callbackUrl", req.url);
		return NextResponse.redirect(authUrl);
	}

	try {
		for (const route of Object.values(PROTECTED_ROUTES)) {
			if (pathname.startsWith(route.PATH)) {
				for (const permission of route.PERMISSIONS) {
					const hasPerm = await hasPermission(permission);
					if (!hasPerm) {
						logWeb();
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

		logWeb();

		return response;
	} catch (error) {
		console.error("Erreur middleware:", error);
		log.web({ message: `Middleware error: ${(error as Error).message}`, user: session?.user, ip, endpoint, requestId, method: req.method, edge: true });
		return new NextResponse(null, { status: 500 });
	}
}

export const config = {
	matcher: ["/((?!api/auth|api/artifactServer|api/reload|cgi-bin/artifactServer|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z]+$).*)"],
};
