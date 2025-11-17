"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserData, updateSetting } from "../../../lib/database";
import { getUserById, searchUsers, getAllUsers } from "../../../services/users";
import { ApiUser, EnrichedFund, EnrichedTravel } from "@/types";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Search, User } from "lucide-react";
import { FundsAndTravelsTable } from "@/components/table";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AdminPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const translations = {
		page: useTranslations("pages.admin"),
		actions: useTranslations("actions"),
		error: useTranslations("errors.dataLoading"),
		updateError: useTranslations("errors.updateSetting"),
		status: useTranslations("status"),
		entities: useTranslations("entities"),
	};

	const [funds, setFunds] = useState<EnrichedFund[]>([]);
	const [travels, setTravels] = useState<EnrichedTravel[]>([]);
	const [error, setError] = useState<string | null>(null);
	let typingTimer: NodeJS.Timeout = setTimeout(() => { }, 0);
	const [loading, setLoading] = useState({ search: false, data: false });
	const [noData, setNoData] = useState(false);
	const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<ApiUser[]>([]);
	const [searchValue, setSearchValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
	const [useCacheSearch, setUseCacheSearch] = useState(false);

	useEffect(() => {
		const loadUsers = async () => {
			try {
				const compressedUsers = await getAllUsers();

				if (compressedUsers.length === 0) {
					setUseCacheSearch(false);
					return;
				}

				const users = compressedUsers.map((u: { i: string; e: string; f: string; l: string; d: string; n: string; m: string; }) => ({
					id: u.i,
					email: u.e,
					firstname: u.f,
					lastname: u.l,
					display: u.d,
					normalized: u.n,
					name: u.m,
				}));

				setAllUsers(users);
				setUseCacheSearch(true);
			} catch (error) {
				console.error("Error loading users:", error);
				setUseCacheSearch(false);
			}
		};

		loadUsers();
	}, []);

	useEffect(() => {
		const userId = searchParams.get("u");
		if (userId && !selectedUser) {
			fetchUserData(userId);

			if (useCacheSearch && allUsers.length > 0) {
				const user = allUsers.find(u => u.id === userId);
				if (user) {
					setSearchValue(user.name);
					setSelectedUser(user);
				} else {
					setSearchValue(userId);
				}
			} else if (!useCacheSearch) {
				getUserById(userId).then(user => {
					if (user) {
						setSearchValue(user.name);
						setSelectedUser(user);
					} else {
						setSearchValue(userId);
					}
				});
			}
		}
	}, [searchParams, useCacheSearch, allUsers]);

	const fetchUserData = async (sciper: string) => {
		setError(null);
		setNoData(false);
		setLoading((prev) => ({ ...prev, data: true }));

		try {
			const userData = await getUserData(sciper);
			if (userData.error) {
				setError(userData.error);
				setFunds([]);
				setTravels([]);
			} else if (
				userData.funds.length > 0 ||
				userData.travels.length > 0
			) {
				setFunds(userData.funds);
				setTravels(userData.travels);
			} else {
				setFunds([]);
				setTravels([]);
				setNoData(true);
			}
		} catch (error) {
			console.error("Error fetching user data:", error);
			setError(translations.page("errorMessage"));
			setFunds([]);
			setTravels([]);
		} finally {
			setLoading((prev) => ({ ...prev, data: false }));
		}
	};

	async function handleUserChoice(sciper: string) {
		router.push(`/admin?u=${sciper}`);
		await fetchUserData(sciper);
	}

	function filterUsers(inputValue: string) {
		const value = inputValue.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
		if (!value || value.length < 2) {
			setFilteredUsers([]);
			return;
		}

		const searchTerm = value.toLowerCase();
		const filtered = allUsers.filter(user => {
			const name = user.name?.toLowerCase() || "";
			const id = user.id?.toLowerCase() || "";
			const email = user.email?.toLowerCase() || "";
			const display = user.display?.toLowerCase() || "";
			const normalized = user.normalized?.toLowerCase() || "";

			return name.includes(searchTerm) ||
				id.includes(searchTerm) ||
				email.includes(searchTerm) ||
				display.includes(searchTerm) ||
				normalized.includes(searchTerm);
		}).slice(0, 10);

		setFilteredUsers(filtered);
	}

	async function doneTyping(inputValue: string) {
		const users = await searchUsers(inputValue);
		setFilteredUsers(users);
		setLoading((prev) => ({ ...prev, search: false }));
	}

	async function handleToggleChange(checked: boolean, settingId: string) {
		try {
			const fund = funds.find((f) => f.setting?.id === settingId);
			const travel = travels.find((t) => t.setting?.id === settingId);

			await updateSetting(checked, settingId);
			setFunds((prev) =>
				prev.map((fund) =>
					fund.setting?.id === settingId
						? { ...fund, setting: { ...fund.setting, shown: checked } }
						: fund,
				),
			);
			setTravels((prev) =>
				prev.map((travel) =>
					travel.setting?.id === settingId
						? { ...travel, setting: { ...travel.setting, shown: checked } }
						: travel,
				),
			);

			if (fund) {
				const status = checked ? translations.status("shown") : translations.status("hidden");
				toast.success(
					translations.actions("updateSuccess", {
						type: translations.entities("fund"),
						name: fund.label,
						status: status,
					}),
				);
			} else if (travel) {
				const status = checked ? translations.status("shown") : translations.status("hidden");
				toast.success(
					translations.actions("updateSuccess", {
						type: translations.entities("travel"),
						name: travel.name,
						status: status,
					}),
				);
			} else {
				toast.success(translations.actions("updateSuccess"));
			}
		} catch (error) {
			console.error("Error updating setting:", error);
			toast.error(translations.updateError("title"), {
				description: translations.updateError("description"),
			});
		}
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-semibold flex items-center gap-3">
						{translations.page("title")}
					</h1>
					<p className="text-muted-foreground mt-2">
						{translations.page("subtitle")}
					</p>
				</div>
				<div>
					<div className="relative max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder={translations.page("placeholder")}
							value={searchValue}
							onChange={(e) => {
								const value = e.target.value;
								setSearchValue(value);

								if (useCacheSearch) {
									filterUsers(value);
									setIsOpen(value.length >= 2 && filteredUsers.length > 0);
								} else {
									if (value.length >= 3) {
										clearTimeout(typingTimer);
										setLoading((prev) => ({
											...prev,
											search: true,
										}));
										setIsOpen(true);
										typingTimer = setTimeout(
											() => doneTyping(value),
											100,
										);
									} else {
										clearTimeout(typingTimer);
										setLoading((prev) => ({
											...prev,
											search: false,
										}));
										setFilteredUsers([]);
										setIsOpen(false);
									}
								}
							}}
							className="pl-10 pr-10"
						/>
						{loading.search && (
							<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
						)}
					</div>

					{isOpen && filteredUsers.length > 0 && (
						<div className="max-w-md bg-background">
							<Command className="bg-background">
								<CommandList className="max-h-48 max-w-md z-50 w-full absolute bg-background border border-t-0 mt-0.5 border-border rounded-md shadow-md">
									<CommandEmpty>
										{translations.page("noResults")}
									</CommandEmpty>
									<CommandGroup>
										{filteredUsers.map((user) => (
											<CommandItem
												key={user.id}
												onSelect={async () => {
													await handleUserChoice(
														user.id,
													);
													setIsOpen(false);
													setSearchValue(
														user.name || user.display,
													);
												}}
												className="cursor-pointer"
											>
												<User className="mr-2 h-4 w-4" />
												{`${user.name} (${user.id})`}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</div>
					)}
				</div>

				{error && (
					<div className="rounded-lg border border-destructive bg-destructive/5 p-4">
						<h3 className="font-semibold text-destructive">
							{translations.page("loadingError")}
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{error}
						</p>
						{selectedUser && (
							<button
								onClick={() => fetchUserData(selectedUser?.id)}
								className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
							>
								{translations.actions("retry")}
							</button>
						)}
					</div>
				)}

				{loading.data && (
					<div className="container mx-auto p-6">
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="flex items-center gap-2">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span>{translations.actions("loading")}</span>
							</div>
						</div>
					</div>
				)}

				{!loading.data && (travels.length > 0 || funds.length > 0) && (
					<div className="space-y-4">
						<div>
							<h2 className="text-lg font-semibold">
								{translations.page("results")}
							</h2>
							<p className="text-sm text-muted-foreground">
								{translations.page("resultsDescription", { user: selectedUser?.name || "" })}
							</p>
						</div>
						<FundsAndTravelsTable
							funds={funds}
							travels={travels}
							onToggleChange={handleToggleChange}
						/>
					</div>
				)}

				{noData && (
					<div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
							<Search className="h-6 w-6 text-muted-foreground" />
						</div>
						<h3 className="mt-4 text-lg font-semibold">
							{translations.page("noData")}
						</h3>
						<p className="mt-2 text-muted-foreground">
							{translations.page("noDataDescription")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
