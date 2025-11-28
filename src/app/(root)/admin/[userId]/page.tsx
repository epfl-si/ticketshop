"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserData, updateSetting } from "../../../../lib/database";
import { getUserById, searchUsers } from "../../../../services/users";
import { ApiUser, EnrichedFund, EnrichedTravel } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { FundsAndTravelsTable } from "@/components/table";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminUserPage() {
	const router = useRouter();
	const params = useParams();
	const userId = params.userId as string;

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
	const [loading, setLoading] = useState(true);
	const [noData, setNoData] = useState(false);
	const [user, setUser] = useState<ApiUser | null>(null);

	useEffect(() => {
		if (userId) {
			resolveUserAndFetchData(decodeURIComponent(userId));
		}
	}, [userId]);

	const resolveUserAndFetchData = async (identifier: string) => {
		setLoading(true);
		setError(null);
		setNoData(false);

		try {
			let resolvedUserId: string | null = null;
			let userData: ApiUser | null = null;

			if (/^\d+$/.test(identifier)) {
				resolvedUserId = identifier;
				userData = await getUserById(identifier);
			} else {
				const users = await searchUsers(identifier);
				if (users.length > 0) {
					userData = users[0];
					resolvedUserId = userData.id;
				}
			}

			if (!resolvedUserId) {
				setError(translations.page("userNotFound"));
				setLoading(false);
				return;
			}

			setUser(userData);
			await fetchUserData(resolvedUserId);
		} catch (error) {
			console.error("Error resolving user:", error);
			setError(translations.page("errorMessage"));
			setLoading(false);
		}
	};

	const fetchUserData = async (sciper: string) => {
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
			setLoading(false);
		}
	};

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
				{user && (
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push("/admin")}
							className="cursor-pointer"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div>
							<h1 className="text-3xl font-semibold">
								{user.name || user.display}
							</h1>
							<p className="text-muted-foreground mt-1">
								{user.email} • {user.id}
							</p>
						</div>
					</div>
				)}

				{error && (
					<div className="rounded-lg border border-destructive bg-destructive/5 p-4">
						<h3 className="font-semibold text-destructive">
							{translations.page("loadingError")}
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{error}
						</p>
						<button
							onClick={() => resolveUserAndFetchData(userId)}
							className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						>
							{translations.actions("retry")}
						</button>
					</div>
				)}

				{loading && (
					<div className="container mx-auto p-6">
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="flex items-center gap-2">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span>{translations.actions("loading")}</span>
							</div>
						</div>
					</div>
				)}

				{!loading && (travels.length > 0 || funds.length > 0) && (
					<div className="space-y-4">
						<FundsAndTravelsTable
							funds={funds}
							travels={travels}
							onToggleChange={handleToggleChange}
						/>
					</div>
				)}

				{noData && !loading && (
					<div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
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
