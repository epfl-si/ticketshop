"use server";
import { makeApiCall } from "../lib/api";
import { ApiFund } from "@/types/api";

interface AuthorizationResponse {
	authorizations: Array<{
		resourceid: string;
		value?: string;
	}>;
}

interface FundResponse {
	funds: ApiFund[];
}

export async function getUserFundAuthorizations(sciper: string): Promise<{ resourceId: string; fund?: string }[]> {
	const data = await makeApiCall<AuthorizationResponse>("/v1/authorizations", "api", {
		persid: sciper,
		authid: "railticket,ndf.travel.org",
		type: "right",
		expand: "1",
	});

	return data.authorizations
		.filter((auth) => auth.resourceid.startsWith("FF"))
		.filter((auth) => !auth.resourceid.startsWith("FF7"))
		.map((auth) => ({
			resourceId: auth.resourceid.slice(2),
			fund: auth.value?.slice(6),
		}));
}

export async function getFundDetails(fundIds: string[]): Promise<ApiFund[]> {
	if (fundIds.length === 0) return [];

	const data = await makeApiCall<FundResponse>("/v1/funds", "api", {
		ids: fundIds.join(","),
	});

	return (data.funds || []).map((fund) => ({
		...fund,
		id: fund.id.slice(2),
		cf: fund.cf.slice(2),

	}));
}
