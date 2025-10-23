import { NextRequest, NextResponse } from "next/server";
import { auth } from "./services/auth";
import { hasPermission } from "./services/policy";
import { PROTECTED_ROUTES } from "./constants/permissions";

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const session = await auth();

	if (!session?.user) {
		const authUrl = new URL("/api/auth", req.url);
		authUrl.searchParams.set("callbackUrl", req.url);
		return NextResponse.redirect(authUrl);
	}

	try {
		for (const route of Object.values(PROTECTED_ROUTES)) {
			if (pathname.startsWith(route.PATH)) {
				for (const permission of route.PERMISSIONS) {
					const hasPerm = await hasPermission(permission);
					if (!hasPerm) {
						return NextResponse.rewrite(new URL("/denied", req.url));
					}
				}
			}
		}

		return NextResponse.next();
	} catch (error) {
		console.error("Erreur middleware:", error);
		return new NextResponse(null, { status: 500 });
	}
}

export const config = {
	matcher: ["/((?!api/auth|api/artifactServer|cgi-bin/artifactServer|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z]+$).*)"],
};
