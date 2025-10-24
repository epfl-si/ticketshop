"use client";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function DeniedPage() {
	const translations = {
		error: useTranslations("errors.accessDenied"),
	};
	const supportEmail = "1234@epfl.ch";

	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<div className="rounded-full bg-destructive/10 p-6">
						<Shield className="h-12 w-12 text-destructive" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{translations.error("title")}</h1>
					<p className="text-muted-foreground">
						{translations.error("description")}
					</p>
				</div>

				<div className="bg-muted/50 rounded-lg p-4 text-left">
					<h3 className="font-semibold text-sm mb-2">{translations.error("requiredRights")}</h3>
					<ul className="text-sm text-muted-foreground space-y-1">
						<li>• railticket</li>
						<li>• ndf.travel.org</li>
					</ul>
				</div>

				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						{translations.error("contact", { supportEmail: supportEmail })}
					</p>
					<Button className="mt-12 cursor-pointer" onClick={() => router.push("/api/auth")}>
						{translations.error("retry")}
					</Button>
				</div>
			</div>
		</div>
	);
}
