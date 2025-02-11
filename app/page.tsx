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
  }, [session]);

  function displayFunds(status: "authenticated" | "loading" | "unauthenticated", funds: {error: string} | fund[]) {
    if(status !== "authenticated") {
      return;
    } else if("error" in funds) {
      return <h1 className="text-2xl font-bold text-red-500">Error: {funds.error}</h1>;
    } else {
      return funds.map((fund:fund, index:number) => (
        <div key={index} className="flex flex-col items-center justify-center w-full h-20 px-4 py-2 m-2 bg-white border border-gray-200 rounded-md shadow-md sm:w-96">
          <h1 className="text-lg font-bold text-red-500">{fund.resourceid}</h1>
        </div>
      ))
    }
  }

  function displayDfs(status: "authenticated" | "loading" | "unauthenticated", dfs: df[]) {
    if(status !== "authenticated") {
      return;
    } else if(!dfs.length) {
      return <h1 className="text-2xl font-bold text-red-500">Error: No DFS found</h1>;
    } else {
      return dfs.map((df:df, index:number) => (
        <div key={index} className="flex flex-col items-center justify-center w-full h-20 px-4 py-2 m-2 bg-white border border-gray-200 rounded-md shadow-md sm:w-96">
          <h1 className="text-lg font-bold text-red-500">{df.destination}</h1>
        </div>
      ))
    }
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {status == "authenticated" ? <SignOutButton /> : <SignInButton btnValue="Sign In" redirectPath="/"/>}
      <div>
        {
          displayFunds(status, funds)
        }
        {
          displayDfs(status, dfs)
        }
      </div>
    </div>
  );
}
