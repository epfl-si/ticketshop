import { ApiFund, ApiTravel } from "./api";
import { DbSetting, DbUser } from "./database";

export interface EnrichedFund extends ApiFund {
	setting?: DbSetting;
}

export interface EnrichedTravel extends ApiTravel {
	uniqueId: string;
	setting?: DbSetting;
}

export interface UserData {
	user: DbUser | null;
	funds: EnrichedFund[];
	travels: EnrichedTravel[];
	error?: string;
}