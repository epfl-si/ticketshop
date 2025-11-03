"use server";
import { Fragment, ReactNode } from "react";
import React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getUser } from "@/services/auth";

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user = await getUser();

	return (
		<Fragment>
			<Header user={user} />
			<main className="flex">
				{children}
			</main>
			<Footer/>
		</Fragment>
	);
}
