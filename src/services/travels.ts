"use server";
import { makeApiCall } from "../lib/api";
import { ApiTravel } from "@/types/api";

interface TravelResponse {
	travelRequests: ApiTravel[];
}

export async function getUserTravels(sciper: string): Promise<ApiTravel[]> {
	const data = await makeApiCall<TravelResponse>("/poq/RESTAdapter/api/fi/travelrequests", "sap");

	return data.travelRequests.filter((travelRequest) => {
		return travelRequest.sciper === parseInt(sciper);
	});
}
