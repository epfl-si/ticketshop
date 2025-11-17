import { User } from "next-auth";

export type EventType =
	| "user.login"
	| "user.logout"
	| "user.access_denied"
	| "fund.disabled"
	| "fund.enabled"
	| "travel.disabled"
	| "travel.enabled"
	| "travel.created"
	| "setting.updated"
	| "cache.reloaded";

export type LogType = "web" | "api" | "soap" | "database" | "event";

export interface BaseLogParams {
	type: LogType;
	user?: User;
	userId?: string;
	message?: string;
	requestId?: string;
	persist?: boolean;
}

export interface WebLogParams extends Omit<BaseLogParams, "type"> {
	endpoint?: string;
	ip?: string | null;
	method?: string;
}

export interface ApiLogParams extends Omit<BaseLogParams, "type"> {
	action: string;
	url: string;
	status?: number;
	method: string;
}

export interface SoapLogParams extends Omit<BaseLogParams, "type"> {
	action: string;
	endpoint: string;
	status?: number;
	method: string;
	direction?: string;
	soap?: string;
}

export interface DatabaseLogParams extends Omit<BaseLogParams, "type"> {
	action: string;
	endpoint?: string;
	status?: string;
	method?: string;
	itemId?: string;
	itemType?: string;
	value?: boolean;
	fundId?: string;
	travelId?: string;
	direction?: string;
}

export interface EventLogParams extends Omit<BaseLogParams, "type"> {
	event: EventType;
	details?: string;
	metadata?: Record<string, unknown>;
}

export interface GetLogsParams {
	limit?: number;
	offset?: number;
	event?: EventType;
	userId?: string;
}
