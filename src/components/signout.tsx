"use client";
import React from "react";
import { User } from "next-auth";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

export const SignOut: React.FC<{ user: User }> = ({ user }) => {
	const translations = {
		navigation: useTranslations("navigation"),
	};

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger>
				<div className="flex items-center gap-1.5">
					<Image
						src={user.image || "/default.jpg"}
						alt={translations.navigation("profileAlt")}
						className="inline-block w-8 h-8 rounded-full ml-2"
						width="30"
						height="30"
					/>
					<p className="text-primary-secondary text-sm sm:text-base font-medium">
						{user.name}
					</p>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onSelect={() => signOut({ redirectTo: "/" })}>
					{translations.navigation("signout")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
