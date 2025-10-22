"use client";
import { useState } from "react";
import { getUserData } from "../../../lib/database";
import { searchUsers } from "../../../services/users";
import { ApiUser, EnrichedFund, EnrichedTravel } from "@/types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Search, User, MapPin, DollarSign } from "lucide-react";

export default function SearchPage() {
	const [funds, setFunds] = useState<EnrichedFund[]>([]);
	const [travels, setTravels] = useState<EnrichedTravel[]>([]);
	let typingTimer: NodeJS.Timeout = setTimeout(() => { }, 0);
	const [loading, setLoading] = useState(false);
	const [noData, setNoData] = useState(false);
	const [users, setUsers] = useState<ApiUser[]>([]);
	const [searchValue, setSearchValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	async function handleUserChoice(sciper: string) {
		const userData = await getUserData(sciper);
		if (userData.error) {
			setFunds([]);
			setTravels([]);
			setNoData(true);
		} else if (userData.funds.length > 0 || userData.travels.length > 0) {
			setFunds(userData.funds);
			setTravels(userData.travels);
			setNoData(false);
		} else {
			setFunds([]);
			setTravels([]);
			setNoData(true);
		}
	}

	async function doneTyping(inputValue: string) {
		const users = await searchUsers(inputValue);
		setUsers(users);
		setLoading(false);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-semibold flex items-center gap-3">
						<Search className="h-8 w-8 text-primary" />
						Recherche d&apos;utilisateur
					</h1>
					<p className="text-muted-foreground mt-2">Recherchez et consultez les fonds et voyages d&apos;autres utilisateurs</p>
				</div>

				<div className="relative max-w-md">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Rechercher une personne (min 3 caractères)..."
						value={searchValue}
						onChange={(e) => {
							const value = e.target.value;
							setSearchValue(value);
							if (value.length >= 3) {
								clearTimeout(typingTimer);
								setLoading(true);
								setIsOpen(true);
								typingTimer = setTimeout(() => doneTyping(value), 1000);
							} else {
								clearTimeout(typingTimer);
								setLoading(false);
								setUsers([]);
								setIsOpen(false);
							}
						}}
						className="pl-10 pr-10"
					/>
					{loading && (
						<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
					)}
				</div>

				{isOpen && users.length > 0 && (
					<div className="max-w-md">
						<Command>
							<CommandList className="max-h-48">
								<CommandEmpty>No results found.</CommandEmpty>
								<CommandGroup>
									{users.map((user) => (
										<CommandItem
											key={user.id}
											onSelect={async () => {
												await handleUserChoice(user.id);
												setIsOpen(false);
												setSearchValue(user.display);
											}}
											className="cursor-pointer"
										>
											<User className="mr-2 h-4 w-4" />
											{`${user.display} (${user.id})`}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</div>
				)}

				{(travels.length > 0 || funds.length > 0) && (
					<div className="space-y-4">
						<div>
							<h2 className="text-lg font-semibold">Résultats de la recherche</h2>
							<p className="text-sm text-muted-foreground">
								Fonds et voyages de l&apos;utilisateur sélectionné
							</p>
						</div>
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-32">Type</TableHead>
										<TableHead>ID</TableHead>
										<TableHead>Nom</TableHead>
										<TableHead>Détails</TableHead>
										<TableHead>Statut</TableHead>
										<TableHead className="text-center">Affiché</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{funds.map((fund) => (
										<TableRow key={fund.id}>
											<TableCell>
												<Badge variant="secondary" className="bg-blue-100 text-blue-800">
													<DollarSign className="mr-1 h-3 w-3" />
													Fond
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
															Unité: {fund.unit.path}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="default">Actif</Badge>
											</TableCell>
											<TableCell className="text-center">
												<Badge variant={fund.setting?.shown ?? true ? "default" : "outline"}>
													{fund.setting?.shown ?? true ? "ON" : "OFF"}
												</Badge>
											</TableCell>
										</TableRow>
									))}
									{travels.map((travel) => (
										<TableRow key={travel.requestID}>
											<TableCell>
												<Badge variant="secondary" className="bg-green-100 text-green-800">
													<MapPin className="mr-1 h-3 w-3" />
													Voyage
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
															Fond: {Array.isArray(travel.imputation) ? travel.imputation[0]?.fund : travel.imputation.fund} - CF: {Array.isArray(travel.imputation) ? travel.imputation[0]?.cf : travel.imputation.cf}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="default">Active</Badge>
											</TableCell>
											<TableCell className="text-center">
												<Badge variant={travel.setting?.shown ?? true ? "default" : "outline"}>
													{travel.setting?.shown ?? true ? "ON" : "OFF"}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}

				{noData && (
					<div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
							<Search className="h-6 w-6 text-muted-foreground" />
						</div>
						<h3 className="mt-4 text-lg font-semibold">Aucune donnée trouvée</h3>
						<p className="mt-2 text-muted-foreground">
							Cet utilisateur n&apos;a aucun fonds ou voyage à afficher.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
