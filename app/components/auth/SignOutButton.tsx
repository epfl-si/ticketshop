"use client";

import { signOut } from "next-auth/react"
 
export function SignOutButton() {
  return (
    <button
      className="rounded-xl text-sm font-semibold bg-sky-500 py-2 px-4 text-sm text-white transition ease-in-out data-[hover]:bg-sky-600"
      onClick={() => signOut()}>
        Sign Out
    </button>
  )
}