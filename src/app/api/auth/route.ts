import { signIn } from "@/auth"

export async function GET(req: Request) {
	const searchParams = new URL(req.url).searchParams;
	return signIn('microsoft-entra-id', { redirectTo: searchParams.get('callbackUrl') ?? '/' });
}