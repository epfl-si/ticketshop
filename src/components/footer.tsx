"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import packageConfig from '../../package.json' with { type: 'json' };

export const Footer: React.FC<{  }> = ({  }) => {
	const translations = {
		footer: useTranslations("footer"),
	};

	return (
		<footer className="text-primary-secondary py-2 px-2 sm:py-3 sm:px-6 flex items-center justify-between border-t-2 border-0 select-none">
			<div>
				<Link href="/help" className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground">
					{translations.footer("help")}
				</Link>
			</div>
			<div>
				<Link href={`https://github.com/epfl-si/ticketshop/releases/tag/v${packageConfig.version}`} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground">
					{translations.footer("version")} v{packageConfig.version}
				</Link>
			</div>
			<div>
				<Link href="https://github.com/epfl-si/ticketshop/" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground">
					{translations.footer("code")}
				</Link>
			</div>
		</footer>
	);
};
