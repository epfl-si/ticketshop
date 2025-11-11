import { NextResponse } from "next/server";
import { reloadUsersCache } from "@/services/users";

export async function POST() {
	const result = await reloadUsersCache();

	if (!result.success) {
		return NextResponse.json(
			{ success: false, error: result.error },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		success: true,
		count: result.count,
		message: `Users cached: ${result.count}`,
	});
}
