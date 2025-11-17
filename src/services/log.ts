import { User } from "next-auth";

async function web({ user, endpoint, ip, requestId, message, method }: { user?: User, endpoint?: string, ip?: string | null, requestId?: string, message?: string, method?: string }): Promise<void> {
	logs({
		type: "web",
		user: user ?
			{ id: user?.userId, name: user?.name, groups: user?.groups } : undefined,
		ip,
		endpoint,
		requestId,
		message,
		method,
	});
}

async function api({ message, action, url, status, method, requestId }: { action: string, message: string, url: string, status?: number, method: string, ip?: string, requestId?: string }): Promise<void> {
	logs({
		type: "api",
		message,
		action,
		url,
		status,
		method,
		requestId,
	});
}

async function soap({ message, action, endpoint, status, method, requestId, direction, soap }: { action: string, message?: string, endpoint: string, status?: number, method: string, ip?: string | null, direction?: string, requestId?: string, soap?: string }): Promise<void> {
	logs({
		type: "soap",
		message,
		action,
		endpoint,
		status,
		method,
		direction,
		soap,
		requestId,
	});
}

async function database({ message, action, endpoint, status, method, requestId, itemId, itemType, value, fundId, travelId, direction }: { action: string, message?: string, endpoint?: string, status?: string, method?: string, direction?: string, requestId?: string | undefined, itemId?: string, itemType?: string, value?: boolean, fundId?: string, travelId?: string }): Promise<void> {
	logs({
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
		direction,
	});
}

function logs(params: object) {
	const paramWithoutUndefined = Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== null),
	);

	console.info(JSON.stringify(paramWithoutUndefined));
}

const log = { web, api, soap, database };

export default log;
