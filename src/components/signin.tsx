"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

export const SignIn: React.FC = () => {
	const translations = {
		navigation: useTranslations("navigation"),
	};

	return (
		<div className="flex items-center gap-1.5">
			<span onClick={() => signIn("microsoft-entra-id", { redirectTo: "/settings" })} className="text-muted-foreground hover:text-foreground hover:cursor-pointer font-medium">{translations.navigation("signin")}</span>
		</div>
	);
};
