import { Fragment, useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { EnrichedFund, EnrichedTravel } from "@/types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface FundsAndTravelsTableProps {
	funds: EnrichedFund[];
	travels: EnrichedTravel[];
	onToggleChange?: (checked: boolean, settingId: string) => void;
}

type ViewMode = "flat" | "grouped";
// type FilterMode = "all" | "funds" | "travels";
type FilterMode = "funds";
type SortField = "type" | "id" | "name" | "details" | "display";
type SortOrder = "asc" | "desc";
type Item = (EnrichedFund & { itemType: "fund" }) | (EnrichedTravel & { itemType: "travel" });

export function FundsAndTravelsTable({ funds, travels, onToggleChange }: FundsAndTravelsTableProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("grouped");
	// const [filterMode, setFilterMode] = useState<FilterMode>("all");
	const [filterMode, setFilterMode] = useState<FilterMode>("funds");
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
	const [groupStates, setGroupStates] = useState<Record<string, boolean>>({});
	const [allGroupOpen, setAllGroupOpen] = useState<boolean>(false);

	const translations = {
		fields: useTranslations("fields"),
		entities: useTranslations("entities"),
		status: useTranslations("status"),
		actions: useTranslations("actions"),
	};

	const noCFLabel = translations.fields("noCF");

	const groupedByCF = useMemo(() => {
		return funds.reduce((acc, fund) => {
			const cf = fund.cf || noCFLabel;
			if (!acc[cf]) acc[cf] = [];
			acc[cf].push(fund);
			return acc;
		}, {} as Record<string, EnrichedFund[]>);
	}, [funds, noCFLabel]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setGroupStates(prev => {
				const newStates = { ...prev };
				Object.entries(groupedByCF).forEach(([cf, groupFunds]) => {
					const allShown = groupFunds.every((fund: EnrichedFund) => fund.setting?.shown ?? true);
					const allHidden = groupFunds.every((fund: EnrichedFund) => !(fund.setting?.shown ?? true));

					if (allShown || allHidden) {
						delete newStates[cf];
					}
				});
				return newStates;
			});
		}, 100);

		return () => clearTimeout(timeoutId);
	}, [groupedByCF]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const toggleGroup = (cf: string) => {
		setExpandedGroups(prev => {
			const newSet = new Set(prev);
			if (newSet.has(cf)) {
				newSet.delete(cf);
			} else {
				newSet.add(cf);
			}

			const totalGroups = Object.keys(groupedByCF).length;
			const newExpandedCount = newSet.size;
			setAllGroupOpen(newExpandedCount === totalGroups);

			return newSet;
		});
	};

	const toggleAllGroup = () => {
		const allCFs = Object.keys(groupedByCF);

		if (allGroupOpen) {
			setExpandedGroups(new Set());
			setAllGroupOpen(false);
		} else {
			setExpandedGroups(new Set(allCFs));
			setAllGroupOpen(true);
		}
	};

	const toggleAllInGroup = (cf: string, checked: boolean) => {
		setGroupStates(prev => ({ ...prev, [cf]: checked }));

		setTimeout(() => {
			const groupFunds = funds.filter(fund => fund.cf === cf);
			groupFunds.forEach(fund => {
				if (fund.setting?.id) {
					onToggleChange?.(checked, fund.setting.id);
				}
			});
		}, 0);
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		const isActive = sortField === field;
		return (
			<div className="flex flex-col ml-1">
				<ChevronUp
					strokeWidth={4}
					className={cn(
						"h-3 w-3 -mb-1 transition-colors",
						isActive && sortOrder === "asc" ? "text-primary" : "text-gray-300",
					)}
				/>
				<ChevronDown
					strokeWidth={4}
					className={cn(
						"h-3 w-3 transition-colors",
						isActive && sortOrder === "desc" ? "text-primary" : "text-gray-300",
					)}
				/>
			</div>
		);
	};

	const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
		<button
			onClick={() => handleSort(field)}
			className="flex items-center hover:text-foreground transition-colors cursor-pointer"
		>
			{children}
			<SortIcon field={field} />
		</button>
	);

	const allItems: Item[] = [
		...funds.map(fund => ({ ...fund, itemType: "fund" as const })),
		...travels.map(travel => ({ ...travel, itemType: "travel" as const })),
	];

	const filteredItems = allItems.filter(item => {
		if (filterMode === "funds") return item.itemType === "fund";
		// if (filterMode === "travels") return item.itemType === "travel";
		return true;
	});

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
		? [...filteredItems].sort((first, second) => {
			const firstValue = getSortValue(first, sortField);
			const secondValue = getSortValue(second, sortField);
			const comparison = firstValue.localeCompare(secondValue);
			return sortOrder === "asc" ? comparison : -comparison;
		})
		: filteredItems;

	const nbChecked = useMemo(() => {
		return sortedItems.filter(items => items.setting?.shown).length;
	}, [sortedItems]);

	const allCheck = useMemo(() => {
		return nbChecked === sortedItems.length && sortedItems.length > 0;
	}, [nbChecked, sortedItems.length]);

	const partialCheck = useMemo(() => {
		return nbChecked !== sortedItems.length && nbChecked !== 0;
	}, [nbChecked, sortedItems.length]);


	const renderFundRow = (fund: EnrichedFund & { itemType: "fund" }, grouped = false) => (
		<TableRow key={fund.id} className={cn(grouped && "bg-muted/30")}>
			{!grouped && (
				<TableCell>
					<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						{translations.entities("fund")}
					</Badge>
				</TableCell>
			)}
			<TableCell className={cn("font-mono text-sm", grouped && "pl-12")}>
				{fund.id}
			</TableCell>
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
							<span className="font-medium">{translations.fields("cf")}:</span> {fund.cf}
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
			<TableCell>
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
							{translations.entities("fund")}: {
								Array.isArray(travel.imputation)
									? travel.imputation[0]?.fund
									: travel.imputation.fund
							} - {translations.fields("cf")}: {
								Array.isArray(travel.imputation)
									? travel.imputation[0]?.cf
									: travel.imputation.cf
							}
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

	const renderGroupedView = () => {
		// const filteredGroups = filterMode === "travels" ? {} : groupedByCF;
		const filteredGroups = groupedByCF;
		const filteredTravels = filterMode === "funds" ? [] : travels;

		return (
			<Fragment>
				{Object.entries(filteredGroups).map(([cf, groupFunds]: [string, EnrichedFund[]]) => {
					const isExpanded = expandedGroups.has(cf);
					const shownFunds = groupFunds.filter((fund: EnrichedFund) => fund.setting?.shown ?? true);
					const hiddenCount = groupFunds.length - shownFunds.length;
					const allShown = groupStates[cf] !== undefined ? groupStates[cf] : shownFunds.length === groupFunds.length;
					const isPartial = groupStates[cf] === undefined && shownFunds.length > 0 && shownFunds.length < groupFunds.length;

					return (
						<Fragment key={cf}>
							<TableRow className="h-13">
								<TableCell colSpan={2}>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleGroup(cf)}
										className="flex cursor-pointer items-center gap-2 p-0 h-auto hover:bg-transparent"
									>
										<ChevronRight
											className={cn(
												"h-4 w-4 transition-transform",
												isExpanded && "rotate-90",
											)}
										/>
										<span className="font-semibold">{translations.fields("cf")}: {cf}</span>
										<Badge variant="outline" className="ml-2">
											{hiddenCount > 0
												? translations.actions("showOfTotal", { show: shownFunds.length, total: groupFunds.length })
												: groupFunds.length
											}
										</Badge>
									</Button>
								</TableCell>
								<TableCell colSpan={2}>
									<div className="text-sm text-muted-foreground">
										{groupFunds[0]?.unit?.path}
									</div>
								</TableCell>
								<TableCell className="text-center">
									<Switch
										checked={allShown}
										onCheckedChange={(checked) => toggleAllInGroup(cf, checked)}
										className={isPartial ? "data-[state=checked]:bg-yellow-300 data-[state=unchecked]:bg-yellow-300" : "data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
										}
									/>
								</TableCell>
							</TableRow>
							{isExpanded && groupFunds.map((fund: EnrichedFund) =>
								renderFundRow({ ...fund, itemType: "fund" as const }, true),
							)}
						</Fragment>
					);
				})}
				{filteredTravels.map(travel =>
					renderTravelRow({ ...travel, itemType: "travel" as const }),
				)}
			</Fragment>
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-4">
				<div className="flex gap-2">
					<Button
						variant={viewMode === "flat" ? "default" : "outline"}
						size="sm"
						className="cursor-pointer shadow-none"
						onClick={() => setViewMode("flat")}
					>
						{translations.actions("flatView")}
					</Button>
					<Button
						variant={viewMode === "grouped" ? "default" : "outline"}
						size="sm"
						className="cursor-pointer shadow-none"
						onClick={() => setViewMode("grouped")}
					>
						{translations.actions("groupedByCF")}
					</Button>
				</div>
				<div className="flex gap-2 border-l pl-4">
					{/* <Button
						variant={filterMode === "all" ? "default" : "outline"}
						size="sm"
						className="cursor-pointer shadow-none"
						onClick={() => setFilterMode("all")}
					>
						{translations.actions("all")} ({funds.length + travels.length})
					</Button> */}
					<Button
						variant={filterMode === "funds" ? "default" : "outline"}
						size="sm"
						className="cursor-pointer shadow-none"
						onClick={() => setFilterMode("funds")}
					>
						{translations.entities("funds")} ({funds.length})
					</Button>
					{/* <Button
						variant={filterMode === "travels" ? "default" : "outline"}
						size="sm"
						className="cursor-pointer shadow-none"
						onClick={() => setFilterMode("travels")}
					>
						<MapPin className="h-3 w-3" />
						{translations.entities("travels")} ({travels.length})
					</Button> */}
				</div>
				{viewMode === "grouped" && (
					<div className="flex border-l pl-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => toggleAllGroup()}
							className="flex cursor-pointer gap-1 items-center shadow-none"
						>
							<ChevronRight
								className={cn(
									"h-4 w-4 transition-transform",
									allGroupOpen && "rotate-90",
								)}
							/>
							{translations.fields(allGroupOpen ? "toggleAllClose" : "toggleAllOpen")}
						</Button>
					</div>
				)}
			</div>
			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							{viewMode === "flat" && (
								<TableHead className="w-[120px]">
									<SortableHeader field="type">
										{translations.fields("type")}
									</SortableHeader>
								</TableHead>
							)}
							<TableHead className="w-[180px]">
								<SortableHeader field="id">
									{translations.fields("id")}
								</SortableHeader>
							</TableHead>
							<TableHead className="w-[400px]">
								<SortableHeader field="name">
									{translations.fields("name")}
								</SortableHeader>
							</TableHead>
							<TableHead className="w-[460px]">
								<SortableHeader field="details">
									{translations.fields("details")}
								</SortableHeader>
							</TableHead>
							<TableHead className="w-[100px] text-center">
								<SortableHeader field="display">
									{translations.fields("display")}
								</SortableHeader>
							</TableHead>
							<TableHead className="w-20 text-center">
								<Switch
									checked={allCheck}
									onCheckedChange={(checked: boolean) => {
										if (viewMode === "flat") {
											for (const item of sortedItems) {
												onToggleChange?.(checked, item.setting?.id || "");
											}
										} else {
											for (const groupFunds of Object.values(groupedByCF)) {
												for (const fund of groupFunds) {
													onToggleChange?.(checked, fund.setting?.id || "");
												}
											}
										}
									}}
									className={partialCheck ? "data-[state=checked]:bg-yellow-300 data-[state=unchecked]:bg-yellow-300" : "data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"}
								/>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{viewMode === "flat"
							? sortedItems.map(item =>
								item.itemType === "fund"
									? renderFundRow(item)
									: renderTravelRow(item),
							)
							: renderGroupedView()
						}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
