"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { getUser, updateUser } from "../lib/database";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { getUsers } from "../lib/api";

export default function Home() {
  const [funds, setFunds] = useState<{ id: number; resourceId: string; cf: string }[]>([]);
  const [dfs, setDfs] = useState<{ id: number; name: string; requestID: number; dates: string; destination: string }[]>([]);
  const [settings, setSettings] = useState<{ id: number; shown: boolean; userId: number; dfId: number | null; fundId: number | null; }[]>([]);
  const { data: session } = useSession();
  let typingTimer:NodeJS.Timeout = setTimeout(() => {}, 0);
  const [loading, setLoading] = useState(false);
  const [noFundsOrDfs, setNoFundsOrDfs] = useState(false);
  const [users, setUsers] = useState([]);

  async function handleUserChoice(sciper: string) {
    await updateUser(sciper);
    const user = await getUser(sciper) || { funds: [], dfs: [], settings: [] };
    if(user.dfs.length > 0 || user.funds.length > 0) {
      setFunds(user.funds);
      setDfs(user.dfs);
      setSettings(user.settings);
      setNoFundsOrDfs(false);
    } else {
      setFunds([]);
      setDfs([]);
      setSettings([]);
      setNoFundsOrDfs(true)
    }
  }

  async function doneTyping(inputValue: string) {
    const users = await getUsers(inputValue);
    setUsers(users);
    setLoading(false);
  }

  interface Option {
    id: string;
    display: string;
  }

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-8">
        <h1 className="text-3xl font-semibold">Logged in as {session?.user.name}</h1>
      </div>
      {
        session?.user.isAdmin ? (
          <div>
            <form className="flex gap-5">
              <Autocomplete
                id="searchBar"
                freeSolo
                ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
                autoHighlight={true}
                sx={{ width: "400px", minWidth: "30vw" }}
                onChange={async (event, newValue) => {
                  if (typeof newValue !== "string" && newValue?.id) {
                    await handleUserChoice(newValue.id);
                  }
                }}
                disablePortal
                disableClearable
                options={users}
                filterOptions={(options) => options}
                renderOption={(props, option: string | Option) => {
                    if (typeof option === "string") {
                      return (
                        <li {...props} key={option}>
                          <span>{option}</span>
                        </li>
                      );
                    }
                    return (
                      <li {...props} key={option.id}>
                        <span>{option.display} {option.id}</span>
                      </li>
                    );
                }}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  if (value.length >= 3) {
                    clearTimeout(typingTimer);
                    setLoading(true);
                    typingTimer = setTimeout(() => doneTyping(value), 1000);
                  } else {
                    clearTimeout(typingTimer);
                    setLoading(false);
                    setUsers([]);
                  }
                }}
                renderInput={(params) => (
                    <TextField {...params}
                        label="Search for a person"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                    />
                )}
                getOptionLabel={(option: string | Option) => typeof option === "string" ? option : option.display}
              />
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
            { noFundsOrDfs && (
              <p className="text-gray-500 mt-4">This user does not have any funds or DFs to display.</p>
            )}
          </div>
        ) : (
          <>You are not authorized to see this page.</>
        )
      }
    </div>
  );
}
