"use client";
import { useState, useEffect } from "react";
import { getLogs } from "@/actions/logs";
import type { EventType } from "@/types/log";
import { getUsersByIds } from "@/services/users";
import { Loader2, FileText, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiUser } from "@/types";
import { useTranslations } from "next-intl";
import { Prisma } from "@prisma/client";

interface Log {
	id: string;
	createdAt: Date;
	event: string;
	userId: string | null;
	details: string | null;
	metadata: Prisma.JsonValue;
	user: {
		uniqueId: string;
	} | null;
}

export default function LogsPage() {
	const translations = {
		page: useTranslations("pages.logs"),
		actions: useTranslations("actions"),
	};

	const [logs, setLogs] = useState<Log[]>([]);
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState<Record<string, ApiUser>>({});
	const [filter, setFilter] = useState({
		event: "all",
		userId: "",
		targetId: "",
	});

	useEffect(() => {
		fetchLogs();
	}, []);

	async function fetchLogs() {
		setLoading(true);
		try {
			const { logs: fetchedLogs } = await getLogs({
				limit: 100,
				offset: 0,
				event: filter.event && filter.event !== "all" ? (filter.event as EventType) : undefined,
				userId: filter.userId || undefined,
				targetId: filter.targetId,
			});
			setLogs(fetchedLogs);

			const uniqueIds = fetchedLogs
				.flatMap((log: Log) => ([log.user?.uniqueId, (log.metadata as Prisma.JsonObject).target]))
				.filter((id): id is string => id !== null && id !== undefined);

			console.log(uniqueIds);

			if (uniqueIds.length > 0) {
				const userDetails = await getUsersByIds(uniqueIds);
				setUsers(userDetails);
			}
		} catch (error) {
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
		}
	}

	const eventTypes = [
		{ value: "all", label: translations.page("eventTypes.all") },
		{ value: "fund.disabled", label: translations.page("eventTypes.fundDisabled") },
		{ value: "fund.enabled", label: translations.page("eventTypes.fundEnabled") },
		{ value: "travel.disabled", label: translations.page("eventTypes.travelDisabled") },
		{ value: "travel.enabled", label: translations.page("eventTypes.travelEnabled") },
	];

	const getEventBadgeColor = (event: string) => {
		if (event.includes("login")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
		if (event.includes("logout")) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		if (event.includes("denied")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
		if (event.includes("enabled")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
		if (event.includes("disabled")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
		return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			fetchLogs();
		}
	};

	const twoRowTd = (general: string, details: string | undefined) => {
		return (
			<div>
				<div className="font-medium">{general}</div>
				<div className="text-xs text-muted-foreground">{details}</div>
			</div>
		)
	}

	const userTdContent = (user: string | undefined, userDetails: ApiUser | null, type: string) => {
		return (
			<>
				{userDetails ?
						twoRowTd(userDetails.name || `${userDetails?.firstname} ${userDetails?.lastname}`, user)
					: user ? (
						<div>
							<div className="font-medium">{user}</div>
						</div>
					) : (
						<span className="text-muted-foreground">
							{translations.page(type === "target" ? "unknow" : "system")}
						</span>
					)}
			</>
		)
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-semibold flex items-center gap-3">
					{translations.page("title")}
				</h1>
				<p className="text-muted-foreground">
					{translations.page("subtitle")}
				</p>
			</div>

			<div className="flex gap-2 items-end">
				<div className="flex-1">
					<label className="text-sm font-medium mb-2 block">
						{translations.page("filterUserId")}
					</label>
					<Input
						type="text"
						placeholder={translations.page("filterUserIdPlaceholder")}
						value={filter.userId}
						onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
						onKeyDown={handleKeyPress}
					/>
				</div>
				<div className="flex-1">
					<label className="text-sm font-medium mb-2 block">
						{translations.page("filterTargetId")}
					</label>
					<Input
						type="text"
						placeholder={translations.page("filterTargetIdPlaceholder")}
						value={filter.targetId}
						onChange={(e) => setFilter({ ...filter, targetId: e.target.value })}
						onKeyDown={handleKeyPress}
					/>
				</div>
				<div className="w-64">
					<label className="text-sm font-medium mb-2 block">
						{translations.page("filterEventType")}
					</label>
					<Select
						value={filter.event}
						onValueChange={(value) => setFilter({ ...filter, event: value })}
					>
						<SelectTrigger>
							<SelectValue placeholder={translations.page("filterEventTypePlaceholder")} />
						</SelectTrigger>
						<SelectContent>
							{eventTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<button
					onClick={fetchLogs}
					className="px-4 py-2 bg-primary cursor-pointer text-primary-foreground h-9 hover:bg-primary/90 flex items-center gap-2"
				>
					<Filter className="h-4 w-4" />
					{translations.page("applyFilter")}
				</button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="flex items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span>{translations.actions("loading")}</span>
					</div>
				</div>
			) : logs.length === 0 ? (
				<div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
						<FileText className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">
						{translations.page("noLogs")}
					</h3>
					<p className="mt-2 text-muted-foreground">
						{translations.page("noLogsDescription")}
					</p>
				</div>
			) : (
				<div className="rounded-lg border">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("timestamp")}
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("event")}
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("target")}
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("targetUser")}
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("user")}
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium">
										{translations.page("details")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{logs.map((log) => {
									const uniqueId = log.user?.uniqueId;
									const userDetails = uniqueId ? users[uniqueId] : null;
									const userComponent = userTdContent(uniqueId, userDetails, "user");

									const targetId = (log.metadata as Prisma.JsonObject)?.target as string;
									const targetDetails = targetId ? users[targetId] : null;
									const targetComponent = userTdContent(targetId, targetDetails, "target");

									const itemType = (log.metadata as Prisma.JsonObject)?.itemType as string;
									const itemName = (log.metadata as Prisma.JsonObject)?.itemName as string;
									return (
										<tr key={log.id} className="hover:bg-muted/30">
											<td className="px-4 py-3 text-sm">
												{new Date(log.createdAt).toLocaleString("fr-ch")}
											</td>
											<td className="px-4 py-3">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getEventBadgeColor(log.event)}`}>
													{eventTypes.find((et) => et.value === log.event)?.label || log.event}
												</span>
											</td>
											<td className="px-4 py-3 text-sm">
												{twoRowTd(translations.page(itemType), itemName)}
											</td>
											<td className="px-4 py-3 text-sm">
												{targetComponent}
											</td>
											<td className="px-4 py-3 text-sm">
												{userComponent}
											</td>
											<td className="px-4 py-3 text-sm">
												<div>{log.details}</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className="text-sm text-muted-foreground text-center">
				{translations.page("showingLogs", { count: logs.length })}
			</div>
		</div>
	);
}
