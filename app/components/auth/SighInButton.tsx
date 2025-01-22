"use client";

import { signIn } from "next-auth/react"

interface SignInButtonProps {
  btnValue: string;
  redirectPath: string;
}
 
export function SignInButton({ btnValue, redirectPath }: SignInButtonProps) {
  return (
    <button
      className="rounded-xl text-sm font-semibold bg-sky-500 py-2 px-4 text-sm text-white transition ease-in-out data-[hover]:bg-sky-600"
      onClick={() => signIn('microsoft-entra-id', { redirectTo: redirectPath })}>
        {btnValue}
    </button>
  )
}