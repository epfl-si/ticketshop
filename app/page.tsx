"use client";
import { SignInButton } from "./components/auth/SighInButton";
import { SignOutButton } from "./components/auth/SignOutButton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const [funds, setFunds] = useState([]);
  const [dfs, setDfs] = useState([]);
  const { data: session, status } = useSession();

  type fund = {
    accredunitid: number,
    attribution: string,
    authid: number,
    enddate: string,
    labelen: string,
    labelfr: string,
    name: string,
    persid: string,
    resourceid: string,
    status: string,
    type: string,
    value: string,
    workflowid: number,
  }

  type df = {
    requestID: number,
    sciper: number,
    name: string,
    dates: string,
    destination: string,
    concatFunds: number,
    imputation: {
      fund: number,
      cf: string,
    }
  }

  useEffect(() => {
    fetch(`/api/funds/${session?.user.sciper}`)
      .then(res => res.json())
      .then(data => {
        setFunds(data);
      })
      .catch(err => console.log(err));

    fetch(`/api/dfs/${session?.user.sciper}`)
      .then(res => res.json())
      .then(data => {
        setDfs(data);
      })
      .catch(err => console.log(err));
  }, [session?.user.sciper]);

  function displayFunds(status: "authenticated" | "loading" | "unauthenticated", funds: {error: string} | fund[]) {
    if(status !== "authenticated") {
      return;
    } else if("error" in funds) {
      return <h1 className="text-lg">{funds.error}</h1>;
    } else {
      return funds.map((fund:fund) => (
        <label className="inline-flex items-center cursor-pointer" key={fund.resourceid}>
          <input type="checkbox" value="" className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          <span className="ml-2 text-sm text-black">{fund.resourceid}</span>
        </label>
      ))
    }
  }

  function displayDfs(status: "authenticated" | "loading" | "unauthenticated", dfs: df[]) {
    if(status !== "authenticated") {
      return;
    } else if(!dfs.length) {
      return <h1 className="text-lg">No &quot;Décomptes de frais&quot; found</h1>
    } else {
      return dfs.map((df:df) => (
        <label className="inline-flex items-center cursor-pointer" key={df.requestID}>
          <input type="checkbox" value="" className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          <span className="ml-2 text-sm text-black">{df.destination} - {df.requestID}</span>
        </label>
      ))
    }
  }
  return (
    <div className="p-6">
      <div className="flex gap-3 mb-8">
        <h1 className="text-3xl font-semibold">Logged in as {session?.user.name}</h1>
        {status == "authenticated" ? <SignOutButton /> : <SignInButton btnValue="Sign In" redirectPath="/"/>}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Funds</h2>
        {displayFunds(status, funds)}
      </div>
      <div className="flex flex-col gap-2 mt-5">
        <h2 className="text-2xl font-semibold">Décomptes de frais</h2>
        {displayDfs(status, dfs)}
      </div>
    </div>
  );
}
