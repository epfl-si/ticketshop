import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, DollarSign } from "lucide-react";
import { EnrichedFund, EnrichedTravel } from "@/types";
import { useTranslations } from "next-intl";

interface FundsAndTravelsTableProps {
	funds: EnrichedFund[];
	travels: EnrichedTravel[];
	showToggle?: boolean;
	onToggleChange?: (checked: boolean, settingId: string) => void;
}

export function FundsAndTravelsTable({ funds, travels, showToggle = false, onToggleChange }: FundsAndTravelsTableProps) {
	const translations = {
		fields: useTranslations("fields"),
		entities: useTranslations("entities"),
		status: useTranslations("status"),
	};

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-32">{translations.fields("type")}</TableHead>
						<TableHead>{translations.fields("id")}</TableHead>
						<TableHead>{translations.fields("name")}</TableHead>
						<TableHead>{translations.fields("details")}</TableHead>
						{showToggle ? (
							<TableHead className="text-center">{translations.fields("display")}</TableHead>
						) : (
							<TableHead className="text-center">{translations.status("displayed")}</TableHead>
						)}
					</TableRow>
				</TableHeader>
				<TableBody>
					{funds.map((fund) => (
						<TableRow key={fund.id}>
							<TableCell>
								<Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
								{showToggle ? (
									<Switch
										checked={fund.setting?.shown ?? true}
										onCheckedChange={(checked) => onToggleChange?.(checked, fund.setting?.id || "")}
									/>
								) : (
									<Badge variant={fund.setting?.shown ?? true ? "default" : "outline"}>
										{fund.setting?.shown ?? true ? translations.status("on") : translations.status("off")}
									</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
					{travels.map((travel) => (
						<TableRow key={travel.requestID}>
							<TableCell>
								<Badge variant="secondary" className="bg-green-100 text-green-800">
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
								{showToggle ? (
									<Switch
										checked={travel.setting?.shown ?? true}
										onCheckedChange={(checked) => onToggleChange?.(checked, travel.setting?.id || "")}
									/>
								) : (
									<Badge variant={travel.setting?.shown ?? true ? "default" : "outline"}>
										{travel.setting?.shown ?? true ? translations.status("on") : translations.status("off")}
									</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
