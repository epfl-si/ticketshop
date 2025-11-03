import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { EnrichedFund, EnrichedTravel } from "@/types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface FundsAndTravelsTableProps {
	funds: EnrichedFund[];
	travels: EnrichedTravel[];
	onToggleChange?: (checked: boolean, settingId: string) => void;
}

type SortField = "type" | "id" | "name" | "details" | "display";
type SortOrder = "asc" | "desc";
type Item = (EnrichedFund & { itemType: "fund" }) | (EnrichedTravel & { itemType: "travel" });

export function FundsAndTravelsTable({ funds, travels, onToggleChange }: FundsAndTravelsTableProps) {
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

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

	const renderFundRow = (fund: EnrichedFund & { itemType: "fund" }) => (
		<TableRow key={fund.id}>
			<TableCell>
				<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
					<DollarSign className="mr-1 h-3 w-3" />
					{translations.entities("fund")}
				</Badge>
			</TableCell>
			<TableCell className="font-mono text-sm">{fund.id}</TableCell>
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
					{fund.cf && (
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
			<TableCell>
				<Badge variant="default">{translations.status("active")}</Badge>
			</TableCell>
			<TableCell className="text-center">
				<Switch
					checked={travel.setting?.shown ?? true}
					onCheckedChange={(checked) => onToggleChange?.(checked, travel.setting?.id || "")}
				/>
			</TableCell>
		</TableRow >
	);

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-32">
							<SortableHeader field="type">{translations.fields("type")}</SortableHeader>
						</TableHead>
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
					{sortedItems.map(item => item.itemType === "fund" ? renderFundRow(item) : renderTravelRow(item))}
				</TableBody>
			</Table>
		</div>
	);
}
