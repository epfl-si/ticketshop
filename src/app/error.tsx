"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const translations = {
		error: useTranslations("errors.generic"),
		actions: useTranslations("actions"),
	};

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<div className="rounded-full bg-destructive/10 p-6">
						<AlertTriangle className="h-12 w-12 text-destructive" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{translations.error("title")}</h1>
					<p className="text-muted-foreground">
						{translations.error("description")}
					</p>
				</div>

				{error.digest && (
					<div className="bg-muted/50 rounded-lg p-4">
						<p className="text-sm text-muted-foreground">
							{translations.error("errorCode")}: <code className="font-mono">{error.digest}</code>
						</p>
					</div>
				)}

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button onClick={reset} className="flex items-center gap-2 cursor-pointer">
						<RefreshCw className="h-4 w-4" />
						{translations.actions("retry")}
					</Button>
					<Button variant="outline" onClick={() => window.location.href = "/"} className="flex items-center gap-2 cursor-pointer">
						<Home className="h-4 w-4" />
						{translations.actions("backToHome")}
					</Button>
				</div>
			</div>
		</div>
	);
}
