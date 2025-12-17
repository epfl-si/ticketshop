"use client";

import { CodeXml } from "lucide-react";
import { Prisma } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

import { ApiUser } from "@/types";
import { Log as LogType } from "@/app/(root)/logs/page";

import { CodeBlock } from "react-code-block";
import { themes } from "prism-react-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TableRowLogsProps {
	log: LogType;
	users: Record<string, ApiUser>;
	getEventBadgeColor: (event: string) => string;
	getArtifactBadgeColor: (code: number) => string;
}

export function TableRowLogs({ log, users, getEventBadgeColor, getArtifactBadgeColor }: TableRowLogsProps) {

	const translations = {
		page: useTranslations("pages.logs"),
		actions: useTranslations("actions"),
	};

	const uniqueId = log.user?.uniqueId;
	const userDetails = uniqueId ? users[uniqueId] : null;

	const metadata = log.metadata as Prisma.JsonObject;
	const error = metadata?.error as Prisma.JsonObject;

	const targetId = metadata?.target as string;
	const targetResult = metadata?.result as string;
	const targetDetails = targetId ? users[targetId] : null;

	const itemName = metadata?.itemName as string;

	const itemCount = metadata?.itemCount as number;

	const logMessage = log.event.includes("fund") || log.event.includes("travel") ?
		<div>
			{translations.page.rich("fundLogMessage", {
				badge: (chunks) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getEventBadgeColor(log.event)}`}>{chunks}</span>,
				userName: userDetails?.name || `${userDetails?.firstname} ${userDetails?.lastname}`,
				userSciper: uniqueId || "",
				targetName: targetDetails?.name || `${targetDetails?.firstname} ${targetDetails?.lastname}`,
				targetSciper: targetId,
				code: () => <code className={getEventBadgeColor(itemName)}>{itemName}</code>,
				bold: (chunks) => <b className="font-bold">{chunks}</b>,
				state: log.event.replace("fund.", ""),
			})}
		</div>
		:
		log.event === "artifactserver.getArtifact" ?
			<div>
				{translations.page.rich("getArtifactLogMessage", {
					badge: (chunks) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getArtifactBadgeColor(metadata?.status as number)}`}>{chunks}</span>,
					targetName: targetDetails?.name || `${targetDetails?.firstname} ${targetDetails?.lastname}`,
					targetSciper: targetId,
					itemCount,
					errorMessage: (error?.errorMessage || "undefined") as string,
					bold: (chunks) => <b className="font-bold">{chunks}</b>,
				})}
			</div>
			:
			log.event === "artifactserver.getArtifactID" ?
				<div>
					{translations.page.rich("getArtifactIDLogMessage", {
						badge: (chunks) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${getArtifactBadgeColor(metadata?.status as number)}`}>{chunks}</span>,
						targetEmail: targetId,
						sciper: targetResult,
						errorMessage: (error?.errorMessage || "undefined") as string,
						bold: (chunks) => <b className="font-bold">{chunks}</b>,
					})}
				</div>
				:
				<>{log.event}</>;

	return (
		<tr key={log.id} className="hover:bg-muted/30">
			<td className="px-4 py-3 text-sm">
				{new Date(log.createdAt).toLocaleString("fr-ch")}
			</td>
			<td className="px-4 py-3 text-sm flex justify-between">
				{
					logMessage
				}
				{
					metadata?.soapRequest && (
						<div className="flex justify-between">
							<Dialog>
								<DialogTrigger asChild>
									<button className="hover:cursor-pointer">
										<CodeXml className="h-5 w-5" />
									</button>
								</DialogTrigger>
								<DialogContent className="DialogContent max-w-11/12! min-h-11/12! flex flex-col">
									<DialogHeader className="">
										<DialogTitle className="flex font-normal! text-sm">
											<span className="mr-4">
												{new Date(log.createdAt).toLocaleString("fr-ch")}
											</span>
											<span>
												{logMessage}
											</span>
										</DialogTitle>
									</DialogHeader>
									<Tabs defaultValue="response" className="Tabs">
										<TabsList>
											<TabsTrigger value="request">Request</TabsTrigger>
											<TabsTrigger value="response">Response</TabsTrigger>
										</TabsList>
										<TabsContent value="request">
											<Card>
												<CardContent className="grid p-3">
													<CodeBlock code={metadata?.soapRequest as string} language="xml" theme={themes.jettwaveLight}>
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
													<CodeBlock code={metadata?.soapResponse as string} language="xml" theme={themes.jettwaveLight}>
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
						</div>
					)
				}
			</td>
		</tr>
	);
}
