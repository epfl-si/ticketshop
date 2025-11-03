"use client";
import React from "react";
import { User } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { LanguageSelector } from "./language-selector";
import { PERMISSIONS } from "@/constants/permissions";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export const Header: React.FC<{ user: User; }> = ({ user }) => {
	const pathname = usePathname();
	const translations = {
		navigation: useTranslations("navigation"),
	};

	return (
		<header className="text-primary-secondary py-2 px-2 sm:py-3 sm:px-6 flex items-center justify-between border-b-2 border-0 select-none">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 sm:gap-4 p-1 sm:p-3">
					<Image src="https://epfl-si.github.io/elements/svg/epfl-logo.svg" alt="EPFL" width={97} height={28} className="h-4 sm:h-7" />
					<span className="border-l-2 border-solid sm:h-6 h-4 w-1 border-gray-300"></span>
					<Link href="/" className="hover:text-[#FF0000]">
						<h1 className="text-base sm:text-2xl font-bold -ml-1 sm:ml-0">TicketShop</h1>
					</Link>
				</div>

				<nav className="flex items-center gap-4 mt-1">
					{(user.permissions.includes(PERMISSIONS.FUNDS.ALL) || user.permissions.includes(PERMISSIONS.TRAVELS.ALL)) && (
						<Link href="/search" className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-colors", pathname === "/search" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
							<Search className="h-4 w-4" />
							<span className="hidden sm:inline font-semibold">{translations.navigation("search")}</span>
						</Link>
					)}
				</nav>
			</div>

			<div className="flex items-center gap-2 sm:gap-8">
				<div className="flex items-center gap-1.5">
					<Image
						src={user.image || "/default.jpg"}
						alt={translations.navigation("profileAlt")}
						className="inline-block w-8 h-8 rounded-full ml-2"
						width="30"
						height="30"
					/>
					<p className="text-primary-secondary text-sm sm:text-base font-medium">{user.name}</p>
				</div>
				<LanguageSelector />
			</div>
		</header>
	);
};
