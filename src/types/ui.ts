import { ApiFund, ApiTravel } from "./api";
import { DatabaseSetting, DatabaseUser } from "./database";

export interface EnrichedFund extends ApiFund {
    setting?: DatabaseSetting;
}

export interface EnrichedTravel extends ApiTravel {
    uniqueId: string;
    setting?: DatabaseSetting;
}

export interface UserData {
    user: DatabaseUser | null;
    funds: EnrichedFund[];
    travels: EnrichedTravel[];
    error?: string;
}
