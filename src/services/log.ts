import type { WebLogParams, ApiLogParams, SoapLogParams, DatabaseLogParams, EventLogParams, BaseLogParams } from "@/types/log";

function logToConsole(params: BaseLogParams & Record<string, unknown>): void {
	const filtered: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
	};

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			filtered[key] = value;
		}
	}

	console.info(JSON.stringify(filtered));
}

async function log(params: BaseLogParams & Record<string, unknown>): Promise<void> {
	logToConsole(params);

	if (params.persist && params.type === "event" && !params.edge && "event" in params) {
		const { persistToDatabase } = await import("@/lib/log");
		await persistToDatabase(params as unknown as EventLogParams);
	}
}

const web = (params: WebLogParams) => log({ type: "web", ...params });
const api = (params: ApiLogParams) => log({ type: "api", ...params });
const soap = (params: SoapLogParams) => log({ type: "soap", ...params });
const database = (params: DatabaseLogParams) => log({ type: "database", ...params });

const event = (params: EventLogParams) =>
	log({
		type: "event",
		...params,
		persist: true,
	});

const logger = { web, api, soap, database, event };

export default logger;
