import { User } from "next-auth";
import { getUser } from "./auth";

async function web({
	user, endpoint, ip, requestId, message
}: { user?: User, endpoint?: string, ip?: string | null, requestId? : string, message?: string }): Promise<void>{
	const datetime = new Date();
	logs(
		{
			datetime,
			type: "web",
			user: user ?
			{
				id: user?.userId,
				name: user?.name,
				groups: user?.groups
			} : undefined,
			ip,
			endpoint,
			requestId,
			message
		});
}

async function api({
	message, action, url, status, method, requestId
}: { action: string, message: string, url: string, status?: number, method: string, ip?: string, requestId?: string }): Promise<void> {
	const datetime = new Date();
	logs(
		{
			datetime,
			type: "api",
			message,
			action,
			url,
			status,
			method,
			requestId
		});
}

async function soap({
	message, action, endpoint, status, method, requestId, direction, soap
}: { action: string, message?: string, endpoint: string, status?: number, method: string, ip?: string | null, direction?: string, requestId? : string, soap?: string }): Promise<void>{
	const datetime = new Date();
	logs(
		{

			datetime,
			type: "soap",
			message,
			action,
			endpoint,
			status,
			method,
			direction,
			soap,
			requestId
		});
}

async function database({
	message, action, endpoint, status, method, requestId, itemId, itemType, value, fundId, travelId, direction
}: { user: User, action: string, message?: string, endpoint?: string, status?: string, method?: string, direction?: string, requestId? : string, itemId: string, itemType: string, value: boolean, fundId: string, travelId: string }): Promise<void>{
	const datetime = new Date();
	logs(
		{
			datetime,
			type: "database",
			message,
			action,
			endpoint,
			status,
			method,
			itemId,
			itemType,
			requestId,
			value,
			fundId,
			travelId,
			direction
		});
}

function logs(param: object) {
	const paramWithoutUndefined = Object.fromEntries(
		Object.entries(param).filter(([key, value]) => value != null && value != undefined)
	);

	console.log();
	console.log(paramWithoutUndefined);
	console.log();
}

export default { web, api, soap, database };