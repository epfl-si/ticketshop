"use server";

import { getLogs } from "@/lib/log";
import type { GetLogsParams, LogEntry } from "@/types/log";

export async function fetchLogsAction(params: GetLogsParams): Promise<{ logs: LogEntry[]; total: number }> {
	return getLogs(params);
}
