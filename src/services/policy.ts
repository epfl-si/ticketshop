import { PERMISSIONS } from "@/constants/permissions";
import { getUserGroups } from "./auth";

export const GROUP_PERMISSIONS: Record<string, string[]> = {
	"ticketshop-admin_AppGrpU": Object.values(PERMISSIONS).flatMap((category) => Object.values(category)),
	"railticket-right_AppGrpU": [PERMISSIONS.FUNDS.LIST, PERMISSIONS.FUNDS.READ, PERMISSIONS.TRAVELS.LIST, PERMISSIONS.TRAVELS.READ],
};

export async function hasPermission(permission: string): Promise<boolean> {
	const userGroups = await getUserGroups();
	if (!userGroups) return false;

	for (const group of userGroups) {
		if (GROUP_PERMISSIONS[group]?.includes(permission)) {
			return true;
		}
	}
	return false;
}

export async function getPermissions(groups: string[]): Promise<string[]> {
	const permissions: string[] = [];
	for (const group of groups) {
		if (GROUP_PERMISSIONS[group]) {
			permissions.push(...GROUP_PERMISSIONS[group]);
		}
	}
	return Array.from(new Set(permissions));
}
