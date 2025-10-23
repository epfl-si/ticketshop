"use client";
import { Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { updateSetting } from "../../lib/database";
import { getUserData } from "../../lib/database";
import { EnrichedFund, EnrichedTravel } from "@/types";
import { Loader2, Settings } from "lucide-react";
import { FundsAndTravelsTable } from "@/components/table";
import { Error } from "@/components/error";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function Home() {
	const translations = {
		page: useTranslations("pages.home"),
		actions: useTranslations("actions"),
		error: useTranslations("errors.dataLoading"),
		updateError: useTranslations("errors.updateSetting"),
	};

	const [funds, setFunds] = useState<EnrichedFund[]>([]);
	const [travels, setTravels] = useState<EnrichedTravel[]>([]);
	const [error, setError] = useState<string | null>(null);
	const { data: session, status } = useSession();
	const [loading, setLoading] = useState(true);

	const fetchUserData = async () => {
		if (!session?.user.userId) return;

		setLoading(true);
		setError(null);

		try {
			const userData = await getUserData(session.user.userId);
			if (userData.error) {
				setError(userData.error);
			} else {
				setFunds(userData.funds);
				setTravels(userData.travels);
			}
		} catch (error) {
			console.error("Error fetching user data:", error);
			setError(translations.error("defaultMessage"));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUserData();
	}, [session?.user.userId]);

	async function handleToggleChange(checked: boolean, settingId: string) {
		try {
			await updateSetting(checked, settingId);
			setFunds(prev => prev.map(fund =>
				fund.setting?.id === settingId
					? { ...fund, setting: { ...fund.setting, shown: checked } }
					: fund,
			));
			setTravels(prev => prev.map(travel =>
				travel.setting?.id === settingId
					? { ...travel, setting: { ...travel.setting, shown: checked } }
					: travel,
			));
			toast.success(translations.actions("updateSuccess"));
		} catch (error) {
			console.error("Error updating setting:", error);
			toast.error(translations.updateError("title"), {
				description: translations.updateError("description"),
			});
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="flex items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span>{translations.actions("loading")}</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center gap-3">
				<h1 className="text-3xl font-semibold">
					{translations.page.rich("welcome", {
						name: session?.user.name || session?.user.email || "User",
					})}
				</h1>
			</div>

			{status === "authenticated" && (
				<Fragment>
					{error ? (
						<Error error={error} onRetry={fetchUserData} />
					) : (
						<Fragment>
							{(funds.length > 0 || travels.length > 0) ? (
								<div className="space-y-4">
									<div>
										<h2 className="text-lg font-semibold flex items-center gap-2">
											<Settings className="h-5 w-5" />
											{translations.page("displayManagement")}
										</h2>
										<p className="text-sm text-muted-foreground">
											{translations.page("displayDescription")}
										</p>
									</div>
									<FundsAndTravelsTable
										funds={funds}
										travels={travels}
										showToggle={true}
										onToggleChange={handleToggleChange}
									/>
								</div>
							) : (
								<div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
										<Settings className="h-6 w-6 text-muted-foreground" />
									</div>
									<h3 className="mt-4 text-lg font-semibold">{translations.page("noData")}</h3>
									<p className="mt-2 text-muted-foreground">
										{translations.page("noDataDescription")}
									</p>
								</div>
							)}
						</Fragment>
					)}
				</Fragment>
			)}
		</div>
	);
}
