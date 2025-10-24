import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ErrorProps {
	error: string;
	onRetry?: () => void;
}

export function Error({ error, onRetry }: ErrorProps) {
	const translations = {
		error: useTranslations("errors.dataLoading"),
		actions: useTranslations("actions"),
	};
	return (
		<div className="mt-28 flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<div className="rounded-full bg-destructive/10 p-6">
						<AlertTriangle className="h-12 w-12 text-destructive" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{translations.error("title")}</h1>
					<p className="text-muted-foreground">
						{error || translations.error("defaultMessage")}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					{onRetry && (
						<Button
							onClick={onRetry}
							className="flex items-center gap-2"
						>
							<RefreshCw className="h-4 w-4" />
							{translations.actions("retry")}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
