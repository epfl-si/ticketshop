'use client';
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SignOutButton } from "./auth/SignOutButton";
import { SignInButton } from "./auth/SighInButton";

export function Header() {
    const { data: session, status } = useSession();
    const [pfpDropDown, setPfpDropdown] = useState(false);
    
    return (
        <header className="flex justify-between items-center p-4 px-8 bg-gray-200 text-white">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4">
                    <Image
                        src="/epfl_logo.png"
                        alt="EPFL Logo"
                        width="70"
                        height="70"
                    />
                    <Link href="/" className="text-2xl font-bold text-black">TicketShop</Link>
                </div>
                {session?.user.isAdmin && (
                    <Link href="/search" className="text-black hover:text-gray-800 transition ease-in-out">
                        Search
                    </Link>
                )}
            </div>
            <nav>
                <ul className="flex space-x-4 text-black items-center">
                    <li>
                        <button data-dropdown-toggle="dropdown" onClick={() => setPfpDropdown(!pfpDropDown)}>
                            <Image 
                                src={session?.user.image || '/default-pfp.jpg'}
                                alt="Photo de profil"
                                className="inline-block w-10 h-10 rounded-full ml-2"
                                width="40"
                                height="40"
                            />
                        </button>
                        {pfpDropDown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-2">
                                <button
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    TBD    
                                </button>
                            </div>
                        )}
                    </li>
                    <li>
                        {status == "authenticated" ? <SignOutButton /> : <SignInButton btnValue="Sign In" redirectPath="/"/>}
                    </li>
                </ul>
            </nav>
        </header>
    )
}