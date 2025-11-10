"use server";
import { Fragment, ReactNode } from "react";
import React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getUser } from "@/services/auth";

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user = (await auth())?.user;

	return (
		<Fragment>
			<main className="flex flex-col h-screen justify-between">
				<Header user={user} />
				<section className="mb-auto">
					{children}
				</section>
				<Footer />
			</main>
		</Fragment>
	);
}
