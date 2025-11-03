import { Fragment, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { EnrichedFund, EnrichedTravel } from "@/types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface FundsAndTravelsTableProps {
	funds: EnrichedFund[];
	travels: EnrichedTravel[];
	onToggleChange?: (checked: boolean, settingId: string) => void;
}

type ViewMode = "flat" | "grouped";
type SortField = "type" | "id" | "name" | "details" | "display";
type SortOrder = "asc" | "desc";
type Item = (EnrichedFund & { itemType: "fund" }) | (EnrichedTravel & { itemType: "travel" });

export function FundsAndTravelsTable({ funds, travels, onToggleChange }: FundsAndTravelsTableProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("flat");
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	const translations = {
		fields: useTranslations("fields"),
		entities: useTranslations("entities"),
		status: useTranslations("status"),
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			if (sortOrder === "asc") {
				setSortOrder("desc");
			} else {
				setSortOrder("asc");
			}
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const toggleGroup = (cf: string) => {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(cf)) {
			newExpanded.delete(cf);
		} else {
			newExpanded.add(cf);
		}
		setExpandedGroups(newExpanded);
	};

	const toggleAllInGroup = (cf: string, checked: boolean) => {
		const groupFunds = funds.filter(fund => fund.cf === cf);
		groupFunds.forEach(fund => {
			if (fund.setting?.id) {
				onToggleChange?.(checked, fund.setting.id);
			}
		});
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		const isActive = sortField === field;
		return (
			<div className="flex flex-col ml-1">
				<ChevronUp strokeWidth={4} className={cn("h-3 w-3 -mb-1", isActive && sortOrder === "asc" ? "text-primary" : "text-gray-300")} />
				<ChevronDown strokeWidth={4} className={cn("h-3 w-3", isActive && sortOrder === "desc" ? "text-primary" : "text-gray-300")} />
			</div>
		);
	};

	const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
		<button onClick={() => handleSort(field)} className="flex items-center hover:text-foreground transition-colors cursor-pointer">
			{children}
			<SortIcon field={field} />
		</button>
	);

	const allItems: Item[] = [
		...funds.map(fund => ({ ...fund, itemType: "fund" as const })),
		...travels.map(travel => ({ ...travel, itemType: "travel" as const })),
	];

	const getSortValue = (item: Item, field: SortField): string => {
		switch (field) {
			case "type":
				return item.itemType;
			case "id":
				return "id" in item ? item.id : item.requestID.toString();
			case "name":
				return "label" in item ? item.label : item.name;
			case "display":
				return item.setting?.shown ? "1" : "0";
			case "details":
				return "cf" in item ? (item.cf || "") : (item.destination || "");
		}
	};

	const sortedItems = sortField && sortOrder
		? [...allItems].sort((first, second) => {
			const firstValue = getSortValue(first, sortField);
			const secondValue = getSortValue(second, sortField);
			const comparison = firstValue.localeCompare(secondValue);
			return sortOrder === "asc" ? comparison : -comparison;
		})
		: allItems;

	const groupedByCF = funds.reduce((acc, fund) => {
		const cf = fund.cf || "No CF";
		if (!acc[cf]) acc[cf] = [];
		acc[cf].push(fund);
		return acc;
	}, {} as Record<string, EnrichedFund[]>);

	const renderFundRow = (fund: EnrichedFund & { itemType: "fund" }, grouped = false) => (
		<TableRow key={fund.id} className={grouped ? "bg-muted/30" : ""}>
			{!grouped && (
				<TableCell>
					<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						<DollarSign className="mr-1 h-3 w-3" />
						{translations.entities("fund")}
					</Badge>
				</TableCell>
			)}
			<TableCell className={cn("font-mono text-sm", grouped && "pl-12")}>{fund.id}</TableCell>
			<TableCell>
				<div className="font-medium">{fund.label}</div>
				{fund.unit && (
					<div className="text-sm text-muted-foreground">
						{fund.unit.labelfr || fund.unit.labelen}
					</div>
				)}
			</TableCell>
			<TableCell>
				<div className="space-y-1">
					{fund.cf && !grouped && (
						<div className="text-sm">
							<span className="font-medium">CF:</span> {fund.cf}
						</div>
					)}
					{fund.unit?.path && (
						<div className="text-sm text-muted-foreground">
							{translations.fields("unit")}: {fund.unit.path}
						</div>
					)}
				</div>
			</TableCell>
			<TableCell className="text-center">
				<Switch
					checked={fund.setting?.shown ?? true}
					onCheckedChange={(checked) => onToggleChange?.(checked, fund.setting?.id || "")}
					className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
				/>
			</TableCell>
		</TableRow>
	);

	const renderTravelRow = (travel: EnrichedTravel & { itemType: "travel" }) => (
		<TableRow key={travel.requestID}>
			<TableCell>
				<Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
					<MapPin className="mr-1 h-3 w-3" />
					{translations.entities("travel")}
				</Badge>
			</TableCell>
			<TableCell className="font-mono text-sm">{travel.requestID}</TableCell>
			<TableCell>
				<div className="font-medium">{travel.name}</div>
			</TableCell>
			<TableCell>
				<div className="space-y-1">
					{travel.destination && (
						<div className="text-sm flex items-center">
							<MapPin className="mr-1 h-3 w-3" />
							{travel.destination}
						</div>
					)}
					{travel.imputation && (
						<div className="text-sm text-muted-foreground">
							{translations.entities("fund")}: {Array.isArray(travel.imputation) ? travel.imputation[0]?.fund : travel.imputation.fund} - CF: {Array.isArray(travel.imputation) ? travel.imputation[0]?.cf : travel.imputation.cf}
						</div>
					)}
				</div>
			</TableCell>
			<TableCell className="text-center">
				<Switch
					checked={travel.setting?.shown ?? true}
					onCheckedChange={(checked) => onToggleChange?.(checked, travel.setting?.id || "")}
					className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
				/>
			</TableCell>
		</TableRow>
	);

	const renderGroupedView = () => (
		<Fragment>
			{Object.entries(groupedByCF).map(([cf, groupFunds]) => {
				const isExpanded = expandedGroups.has(cf);
				const allShown = groupFunds.every(fund => fund.setting?.shown ?? true);

				return (
					<Fragment key={cf}>
						<TableRow className="h-13">
							<TableCell colSpan={2}>
								<Button variant="ghost" size="sm" onClick={() => toggleGroup(cf)} className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
									<ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
									<span className="font-semibold">CF: {cf}</span>
									<Badge variant="outline" className="ml-2">{groupFunds.length}</Badge>
								</Button>
							</TableCell>
							<TableCell colSpan={2}>
								<div className="text-sm text-muted-foreground">
									{groupFunds[0]?.unit?.path}
								</div>
							</TableCell>
							<TableCell className="text-center">
								<Switch checked={allShown} onCheckedChange={(checked) => toggleAllInGroup(cf, checked)} className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400" />
							</TableCell>
						</TableRow>
						{isExpanded && groupFunds.map(fund => renderFundRow({ ...fund, itemType: "fund" as const }, true))}
					</Fragment>
				);
			})}
			{travels.map(travel => renderTravelRow({ ...travel, itemType: "travel" as const }))}
		</Fragment>
	);

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button variant={viewMode === "flat" ? "default" : "outline"} size="sm" onClick={() => setViewMode("flat")}>
					Flat View
				</Button>
				<Button variant={viewMode === "grouped" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grouped")}>
					Grouped by CF
				</Button>
			</div>
			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							{viewMode === "flat" && (
								<TableHead className="w-32">
									<SortableHeader field="type">{translations.fields("type")}</SortableHeader>
								</TableHead>
							)}
							<TableHead>
								<SortableHeader field="id">{translations.fields("id")}</SortableHeader>
							</TableHead>
							<TableHead>
								<SortableHeader field="name">{translations.fields("name")}</SortableHeader>
							</TableHead>
							<TableHead>
								<SortableHeader field="details">{translations.fields("details")}</SortableHeader>
							</TableHead>
							<TableHead className="flex justify-center">
								<SortableHeader field="display">{translations.fields("display")}</SortableHeader>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{viewMode === "flat"
							? sortedItems.map(item => item.itemType === "fund" ? renderFundRow(item) : renderTravelRow(item))
							: renderGroupedView()
						}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
