"use server";

import { defaultLocale, Locale, locales } from "@/i18n/config";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "locale";

export async function getUserLocale() {
	const userCookies = await cookies();
	const cookieLocale = userCookies.get(COOKIE_NAME)?.value;

	if (cookieLocale && locales.includes(cookieLocale as Locale)) {
		return cookieLocale as Locale;
	}

	const headersList = await headers();
	const acceptLanguage = headersList.get("accept-language");

	if (acceptLanguage) {
		const preferredLocale = getPreferredLocale(acceptLanguage);
		if (preferredLocale) {
			return preferredLocale;
		}
	}

	return defaultLocale;
}

function getPreferredLocale(acceptLanguage: string): Locale | null {
	const languages = acceptLanguage
		.split(",")
		.map(lang => {
			const parts = lang.trim().split(";");
			const locale = parts[0].toLowerCase();
			const qValue = parts[1] ? parseFloat(parts[1].split("=")[1]) : 1;
			return { locale, qValue };
		})
		.sort((a, b) => b.qValue - a.qValue);

	for (const { locale } of languages) {
		const shortLocale = locale.split("-")[0];
		if (locales.includes(shortLocale as Locale)) {
			return shortLocale as Locale;
		}
		if (locales.includes(locale as Locale)) {
			return locale as Locale;
		}
	}

	return null;
}

export async function setUserLocale(locale: Locale) {
	const userCookies = await cookies();
	userCookies.set(COOKIE_NAME, locale);
}
