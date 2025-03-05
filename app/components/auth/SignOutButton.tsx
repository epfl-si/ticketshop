"use client";

import { signOut } from "next-auth/react"
 
export function SignOutButton() {
  return (
    <button
      className="rounded-xl text-sm font-semibold bg-red-600 px-4 text-sm text-white transition ease-in-out hover:bg-red-700"
      onClick={() => signOut()}>
        Sign Out
    </button>
  )
}