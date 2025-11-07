"use client";
import React from "react";
import { User } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRoundCog, Settings } from "lucide-react";
import { LanguageSelector } from "./language-selector";
import { PERMISSIONS } from "@/constants/permissions";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { SignIn } from "./signin";
import { SignOut } from "./signout";

export const Header: React.FC<{ user: User | undefined}> = ({ user }) => {
	const pathname = usePathname();
	const translations = {
		navigation: useTranslations("navigation"),
	};

	return (
		<header className="text-primary-secondary py-2 px-2 sm:py-3 sm:px-6 flex items-center justify-between border-b-2 border-0 select-none">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 sm:gap-4 p-1 sm:p-3">
					<Image
						src="https://epfl-si.github.io/elements/svg/epfl-logo.svg"
						alt="EPFL"
						width={97}
						height={28}
						className="h-4 sm:h-7"
					/>
					<span className="border-l-2 border-solid sm:h-6 h-4 w-1 border-gray-300"></span>
					<Link href="/" className="text-black! hover:text-primary!">
						<h1 className="text-base sm:text-2xl font-bold -ml-1 sm:ml-0">
							Ticketshop
						</h1>
					</Link>
				</div>

				<nav className="flex items-center gap-4 mt-1">
					{user && <Link
							href="/settings"
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
								pathname === "/settings"
									? "text-primary!"
									: "text-muted-foreground! hover:text-foreground!",
							)}
						>
							<Settings className="h-4 w-4" />
							<span className="hidden sm:inline font-semibold">
								{translations.navigation("settings")}
							</span>
						</Link>
					}

					{user && (user?.permissions.includes(PERMISSIONS.FUNDS.ALL) ||
						user?.permissions.includes(PERMISSIONS.TRAVELS.ALL)) && (
						<Link
							href="/admin"
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
								pathname === "/admin"
									? "text-primary!"
									: "text-muted-foreground! hover:text-foreground!",
							)}
						>
							<UserRoundCog className="h-4 w-4" />
							<span className="hidden sm:inline font-semibold">
								{translations.navigation("admin")}
							</span>
						</Link>
					)}
				</nav>
			</div>

			<div className="flex items-center gap-2 sm:gap-8">
				{
					user ? <SignOut user={user}/> : <SignIn/>
				}
				<LanguageSelector />
			</div>
		</header>
	);
};
