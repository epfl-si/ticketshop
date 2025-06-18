"use client";
import { SignInButton } from "../components/auth/SighInButton";
import { SignOutButton } from "../components/auth/SignOutButton";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { getUser, updateUser } from "../lib/database";

export default function Home() {
  const [funds, setFunds] = useState<{ id: number; resourceId: string; cf: string }[]>([]);
  const [dfs, setDfs] = useState<{ id: number; name: string; requestID: number; dates: string; destination: string }[]>([]);
  const [settings, setSettings] = useState<{ id: number; shown: boolean; userId: number; dfId: number | null; fundId: number | null; }[]>([]);
  const { data: session, status } = useSession();

  async function handleUserSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchValue = formData.get('search') as string;
    await updateUser(searchValue);
    const user = await getUser(searchValue) || { funds: [], dfs: [], settings: [] };
    setFunds(user.funds);
    setDfs(user.dfs);
    setSettings(user.settings);
  };

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-8">
        <h1 className="text-3xl font-semibold">Logged in as {session?.user.name}</h1>
        {status == "authenticated" ? <SignOutButton /> : <SignInButton btnValue="Sign In" redirectPath="/"/>}
      </div>
      {
        session?.user.isAdmin ? (
          <div>
            <form onSubmit={handleUserSearch} className="flex gap-5">
              <input 
                type="text"
                className="border-2 border-gray-300 rounded-md p-2 w-1/3 min-w-96"
                placeholder="Search for a user..."
                name="search"
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors ease-in-out"
              >
                Search
              </button>
            </form>
            {
              (dfs.length > 0 || funds.length > 0) && (
                <table className="mt-8 border border-gray-300">
                  <thead>
                  <tr>
                    <th scope="col" className="px-8 border border-gray-300">Valeur</th>
                    <th scope="col" className="px-8 border border-gray-300">Affiché (ON/OFF)</th>
                    <th scope="col" className="px-8 border border-gray-300">Type (DF/Fond)</th>
                  </tr>
                  </thead>
                  <tbody className="text-center">
                    { funds.map((fund) => {
                      const fundSetting = settings.find(s => s.fundId === fund.id);
                      return (
                      <tr key={fund.resourceId}>
                        <th className="border border-gray-300">{fund.resourceId}</th>
                        <td className="border border-gray-300">{fundSetting?.shown ? 'ON' : 'OFF'}</td>
                        <td className="border border-gray-300">Fond</td>
                      </tr>
                      )
                    })}
                    { dfs.map((df) => {
                      const dfSetting = settings.find(s => s.dfId === df.id);
                      return (
                      <tr key={df.requestID}>
                        <th className="border border-gray-300">{df.requestID}</th>
                        <td className="border border-gray-300">{dfSetting?.shown ? 'ON' : 'OFF'}</td>
                        <td className="border border-gray-300">DF</td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            }
          </div>
        ) : (
          <>You are not authorized to see this page.</>
        )
      }
    </div>
  );
}
