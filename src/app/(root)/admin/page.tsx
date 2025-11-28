"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchUsers, getAllUsers } from "../../../services/users";
import { ApiUser } from "@/types";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminPage() {
	const router = useRouter();

	const translations = {
		page: useTranslations("pages.admin"),
	};

	let typingTimer: NodeJS.Timeout = setTimeout(() => { }, 0);
	const [loading, setLoading] = useState(false);
	const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<ApiUser[]>([]);
	const [searchValue, setSearchValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
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

	function handleUserChoice(userId: string) {
		router.push(`/admin/${userId}`);
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
		setLoading(false);
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
										setLoading(true);
										setIsOpen(true);
										typingTimer = setTimeout(
											() => doneTyping(value),
											100,
										);
									} else {
										clearTimeout(typingTimer);
										setLoading(false);
										setFilteredUsers([]);
										setIsOpen(false);
									}
								}
							}}
							className="pl-10 pr-10"
						/>
						{loading && (
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
												onSelect={() => {
													handleUserChoice(user.id);
													setIsOpen(false);
													setSearchValue("");
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
			</div>
		</div>
	);
}
