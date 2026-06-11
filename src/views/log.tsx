"use client";

import { useState, useEffect } from "react";
import { fetchLogsAction } from "@/app/(root)/logs/actions";
import type { EventType, LogEntry, LogMetadata } from "@/types/log";
import { getUsersByIds } from "@/services/users";
import { Loader2, FileText, Filter, CodeXml, ServerCrash, CircleX, CircleCheck, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiUser } from "@/types";
import { useTranslations } from "next-intl";
import { CodeBlock } from "react-code-block";
import { themes } from "prism-react-renderer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function LogsPageView({ targetID }: { targetID?: string }) {
    const translations = {
        page: useTranslations("pages.logs"),
        actions: useTranslations("actions"),
    };

    const router = useRouter();
    const pathname = usePathname();

    const searchParams = useSearchParams();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Record<string, ApiUser>>({});
    const [filter, setFilter] = useState({
        event: searchParams.get("t")?.replaceAll("_", ".") || "all",
        search: targetID
            ? decodeURIComponent(targetID)
            : searchParams.has("q")
				? decodeURIComponent(searchParams.get("q") as string)
				: "",
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const updateUrl = (url: string) => {
        router.push(url);
    };

    async function fetchLogs() {
        setLoading(true);
        const search = [
            { key: "q", value: filter.search },
            { key: "t", value: filter.event },
        ];
        if ((filter.search && filter.search !== "") || (filter.event && filter.event != "all")) {
            const searchArray = search
                .filter((param) => param.value && param.value !== "all" && param.key != "q")
                .map((param) => `${param.key}=${param.value}`);
            const urlParams = searchArray.join("&");
            updateUrl(
                `${"/" + pathname.split("/").filter((val) => val)[0]}${filter.search ? "/" + encodeURIComponent(filter.search) : ""}${searchArray.length > 0 ? `?${urlParams}` : ""}`,
            );
        } else {
            updateUrl("/" + pathname.split("/").filter((val) => val)[0]);
        }
        try {
            const { logs: fetchedLogs } = await fetchLogsAction({
                limit: 100,
                offset: 0,
                event: filter.event !== "all" ? (filter.event as EventType) : undefined,
                search: filter.search || undefined,
            });
            setLogs(fetchedLogs);

            const scipers = [
                ...new Set(
                    fetchedLogs
                        .flatMap((log) => [
                            log.user?.uniqueId,
                            log.metadata?.sciper,
                            log.metadata?.targetSciper,
                            log.metadata?.adminSciper,
                        ])
                        .filter((id): id is string => Boolean(id) && /^\d+$/.test(id as string)),
                ),
            ];

            if (scipers.length > 0) {
                const userDetails = await getUsersByIds(scipers);
                setUsers(userDetails);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }

    const eventTypes = [
        { value: "all", label: translations.page("events.all") },
        { value: "fund.disabled", label: translations.page("events.fundDisabled") },
        { value: "fund.enabled", label: translations.page("events.fundEnabled") },
        { value: "artifactserver.getArtifact", label: translations.page("events.getArtifact") },
        { value: "artifactserver.getArtifactID", label: translations.page("events.getArtifactID") },
    ];

    function getBadgeColor(event: string, status?: number): string {
        if (status !== undefined) {
            if (status >= 200 && status < 300)
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            if (status >= 400 && status < 500)
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            if (status >= 500) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        }
        if (event.includes("enabled")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        if (event.includes("disabled")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }

    function getUserDisplay(sciper: string): string {
        const user = users[sciper];
        if (!user) return sciper;
        return user.name || `${user.firstname} ${user.lastname}`;
    }

    function formatUser(sciper: string): React.ReactNode {
        return (
            <b>
                {getUserDisplay(sciper)} (#{sciper})
            </b>
        );
    }

    function getEventLabel(event: string): string {
        if (event === "fund.enabled") return translations.page("events.fundEnabled");
        if (event === "fund.disabled") return translations.page("events.fundDisabled");
        if (event === "travel.enabled") return translations.page("events.travelEnabled");
        if (event === "travel.disabled") return translations.page("events.travelDisabled");
        if (event === "artifactserver.getArtifact") return "getArtifact";
        if (event === "artifactserver.getArtifactID") return "getArtifactID";
        return event;
    }

    function renderLogMessage(log: LogEntry): React.ReactNode {
        const { metadata } = log;
        const errorMessage = metadata.error?.errorMessage;

        // Fund/Travel events
        if (log.event.includes("fund") || log.event.includes("travel")) {
            return (
                <span>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getBadgeColor(log.event)}`}
                    >
                        {getEventLabel(log.event)}
                    </span>{" "}
                    <code className="bg-muted px-1 rounded text-xs">{metadata.itemName}</code>{" "}
                    {translations.page("message.for")} {formatUser(metadata.targetSciper ?? "")}
                    {metadata.adminSciper && (
                        <span className="text-muted-foreground">
                            {" - "}
                            {translations.page("message.modifiedBy")} {getUserDisplay(metadata.adminSciper)} (#
                            {metadata.adminSciper})
                        </span>
                    )}
                </span>
            );
        }

        // getArtifact
        if (log.event === "artifactserver.getArtifact") {
            const sciper = metadata.sciper ?? log.user?.uniqueId ?? "";
            return (
                <span>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getBadgeColor(log.event, metadata.status)}`}
                    >
                        {getEventLabel(log.event)}
                    </span>{" "}
                    {translations.page("message.calledFor")} {formatUser(sciper)}
                    {": "}
                    {errorMessage ? (
                        <span className="text-red-600">{errorMessage}</span>
                    ) : (
                        translations.page("message.fundsReturned", { count: metadata.itemCount ?? 0 })
                    )}
                </span>
            );
        }

        // getArtifactID
        if (log.event === "artifactserver.getArtifactID") {
            const sciper = metadata.sciper;
            return (
                <span>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getBadgeColor(log.event, metadata.status)}`}
                    >
                        {getEventLabel(log.event)}
                    </span>{" "}
                    {translations.page("message.calledFor")} <b>{metadata.email}</b>
                    {": "}
                    {errorMessage ? (
                        <span className="text-red-600">{errorMessage}</span>
                    ) : sciper ? (
                        <span>
                            {formatUser(sciper)} {translations.page("message.sciperReturned")}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{translations.page("message.unknown")}</span>
                    )}
                </span>
            );
        }

        return (
            <span>
                {log.event}: {log.details}
            </span>
        );
    }

    function renderSoapDialog(log: LogEntry, metadata: LogMetadata, timestamp: string): React.ReactNode {
        if (!metadata.soapRequest) return null;

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <button className="hover:cursor-pointer">
                        <CodeXml className="h-5 w-5" />
                    </button>
                </DialogTrigger>
                <DialogContent className="DialogContent max-w-11/12! min-h-11/12! flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex font-normal! text-sm">
                            <span className="mr-4">{timestamp}</span>
                            <span>{renderLogMessage(log)}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="response" className="Tabs">
                        <TabsList>
                            <TabsTrigger value="request">{translations.page("request")}</TabsTrigger>
                            <TabsTrigger value="response">{translations.page("response")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="request">
                            <Card>
                                <CardContent className="grid p-3">
                                    <CodeBlock code={metadata.soapRequest} language="xml" theme={themes.jettwaveLight}>
                                        <CodeBlock.Code className="bg-white p-6 rounded-xl shadow-lg text-xs overflow-x-auto w-full">
                                            <div className="table-row">
                                                <CodeBlock.LineNumber className="table-cell pr-4 text-sm text-gray-500 text-right select-none" />
                                                <CodeBlock.LineContent className="table-cell">
                                                    <CodeBlock.Token />
                                                </CodeBlock.LineContent>
                                            </div>
                                        </CodeBlock.Code>
                                    </CodeBlock>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="response">
                            <Card>
                                <CardContent className="grid p-3">
                                    <CodeBlock
                                        code={metadata.soapResponse ?? ""}
                                        language="xml"
                                        theme={themes.jettwaveLight}
                                    >
                                        <CodeBlock.Code className="bg-white p-6 rounded-xl shadow-lg text-xs overflow-x-auto w-full">
                                            <div className="table-row">
                                                <CodeBlock.LineNumber className="table-cell pr-4 text-sm text-gray-500 text-right select-none" />
                                                <CodeBlock.LineContent className="table-cell">
                                                    <CodeBlock.Token />
                                                </CodeBlock.LineContent>
                                            </div>
                                        </CodeBlock.Code>
                                    </CodeBlock>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        );
	}

	const getStatusLog = (log: any) => {
		if (log.metadata.error && log.metadata.status && log.metadata.status >= 500) {
			return "error";
		}
		else if (log.metadata.error && log.metadata.status){
			return "notfound";
		}
		else if (log.metadata.status && log.metadata.status >= 200 && log.metadata.status < 300) {
			return "success";
		}
		else {
			return "notfound";
		}
	}

	const HTTPStatusCard = ({ variant }: { variant: "success" | "notfound" | "error" }) => {
		const formatLogsToState = logs.map(
			(log) => (
				{
					id: log.id,
					status: getStatusLog(log)
				}
			)
        );
        const success = formatLogsToState.filter(
            (log) => log.status === "success",
        );
        const notfound = formatLogsToState.filter(
            (log) => log.status === "notfound",
        );
        const error = formatLogsToState.filter(
            (log) => log.status === "error",
        );
        return (
            <Card
                className={`flex items-center w-full h-40 mx-2 px-2
			${variant === "success" ? "text-green-800" : variant === "notfound" ? "text-yellow-800" : "text-red-800"}`}
            >
                {loading ? (
                    <div className="flex items-center gap-4 w-full">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 w-70/100">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            {variant === "success" ? (
                                <CircleCheck size={50} />
                            ) : variant === "notfound" ? (
                                <CircleX size={50} />
                            ) : (
                                <ServerCrash size={50} />
                            )}
                        </div>
                        <div className="ml-2 flex flex-col">
                            <span>{translations.page(`status.${variant}`)}</span>
                            <span>
                                {variant === "success"
                                    ? success.length
                                    : variant === "notfound"
										? notfound.length
										: error.length}
                            </span>
                        </div>
                    </>
                )}
            </Card>
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            fetchLogs();
        }
    };

    const createDownload = ({ fileData, fileName }: { fileData: string; fileName: string }) => {
        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${fileName}.csv`;
        link.href = url;
        link.click();
        return blob;
    };

    const generateCSV = () => {
        let lineArray = [];
        let result = "";

        let first = true;
        for (let log of logs) {
            const adminUser = users[log.metadata.adminSciper as string];
            const targetUser = users[log.metadata.targetSciper as string];
            let editedLog: any = {
                ...log,
                createdAt: new Date(log.createdAt).toISOString(),
                event: log?.event,
                details: log?.details,
                adminUserSciper: log?.metadata?.adminSciper,
                adminUserName: (adminUser as any)?.name,
                adminUserEmail: (adminUser as any)?.email,
                targetUserSciper: log?.metadata?.targetSciper,
                targetUserName: (targetUser as any)?.name,
                targetUserEmail: (targetUser as any)?.email,
                itemCount: log?.metadata?.itemCount,
                itemId: log?.metadata?.itemId,
                itemName: log?.metadata?.itemName,
                itemType: log?.metadata?.itemType,
                error: log?.metadata?.error,
                status: log?.metadata?.status,
            };

            delete editedLog.metadata;
            delete editedLog.user;

            if (first) {
                lineArray.push(Object.keys(editedLog));
                first = !first;
            }
            lineArray.push(Object.values(editedLog));
        }

        for (let line of lineArray) {
            result += `${line.join(",")}\n`;
        }
        return result;
    };

    const downloadCSV = () => {
        const fileData = generateCSV();

        createDownload({ fileData, fileName: `ticketshop_logs_export_${new Date().toLocaleDateString("en-CA")}` });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold flex items-center gap-3">{translations.page("title")}</h1>
                    <p className="text-muted-foreground">{translations.page("subtitle")}</p>
                </div>
                <Button
                    className="px-4 py-2 bg-primary cursor-pointer text-primary-foreground h-9 hover:bg-primary/90 flex items-center gap-2"
                    disabled={loading || logs.length === 0}
                    onClick={() => downloadCSV()}
                >
                    <Download color="#ffffff" />
					{ translations.page("export") }
                </Button>
            </div>

            <div className="flex justify-between">
                <HTTPStatusCard variant="success" />
                <HTTPStatusCard variant="notfound" />
                <HTTPStatusCard variant="error" />
            </div>

            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{translations.page("filterSearch")}</label>
                    <Input
                        type="text"
                        placeholder={translations.page("filterSearchPlaceholder")}
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        onKeyDown={handleKeyPress}
                    />
                </div>
                <div className="w-64">
                    <label className="text-sm font-medium mb-2 block">{translations.page("filterEvent")}</label>
                    <Select
                        value={filter.event}
                        onValueChange={(value) => setFilter({ ...filter, event: value })}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={translations.page("filterEventPlaceholder")} />
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
                <Button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="px-4 py-2 bg-primary cursor-pointer text-primary-foreground h-9 hover:bg-primary/90 flex items-center gap-2"
                >
                    <Filter className="h-4 w-4" />
                    {translations.page("applyFilter")}
                </Button>
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
                    <h3 className="mt-4 text-lg font-semibold">{translations.page("noLogs")}</h3>
                    <p className="mt-2 text-muted-foreground">{translations.page("noLogsDescription")}</p>
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
                                        {translations.page("details")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => {
                                    const timestamp = new Date(log.createdAt).toLocaleString("fr-ch");
                                    const metadata = log.metadata;
                                    return (
                                        <tr key={log.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{timestamp}</td>
                                            <td className="px-4 py-3 text-sm flex justify-between">
                                                {renderLogMessage(log)}
                                                {renderSoapDialog(log, metadata, timestamp)}
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
