"use server";

import { makeApiCall } from "@/lib/api";
import { getUserFunds, getUserTravelsEnriched } from "@/lib/database";
import { ArtifactProcessingResult, PersonData, ArtifactResponse } from "@/types/artifact";
import { ApiFund, ApiTravel } from "@/types/api";

export async function getPersonByEmail(email: string): Promise<PersonData[] | null> {
	try {
		const data = await makeApiCall<{ persons: PersonData[] }>("/v1/persons", "api", {
			query: email,
		});
		return data.persons || [];
	} catch (error) {
		console.error("Error fetching person by email:", error);
		return null;
	}
}

export async function getPersonBySciper(sciper: string): Promise<PersonData | null> {
	try {
		const data = await makeApiCall<PersonData>(`/v1/persons/${sciper}`, "api");
		return data || undefined;
	} catch (error) {
		console.error("Error fetching person by sciper:", error);
		return null;
	}
}

export async function getUserArtifactData(uniqueId: string): Promise<{ funds: ApiFund[], travels: ApiTravel[] }> {
	try {
		const [funds, travels] = await Promise.all([
			getUserFunds(uniqueId),
			getUserTravelsEnriched(uniqueId),
		]);

		const visibleFunds = funds.filter(fund => fund.setting?.shown);
		const visibleTravels = travels.filter(travel => travel.setting?.shown);

		return {
			funds: visibleFunds,
			travels: visibleTravels,
		};
	} catch (error) {
		console.error("Error fetching user artifact data:", error);
		return { funds: [], travels: [] };
	}
}

export async function processArtifactIDRequest(email: string): Promise<ArtifactProcessingResult> {
	try {
		const persons = await getPersonByEmail(email);

		if (persons.length === 0) {
			return {
				success: false,
				error: {
					errorCode: 2,
					errorMessage: "User not found",
				},
			};
		}
		else if (persons === null || !persons) {
			return {
				success: false,
				error: {
					errorCode: 1,
					errorMessage: "Internal server error",
				},
			};
		}
		const person = persons[0];
		const artifactID = person.id;

		return {
			success: true,
			data: { artifactID },
		};

	} catch (error) {
		console.error("Error processing artifact ID request:", error);
		return {
			success: false,
			error: {
				errorCode: 1,
				errorMessage: "Internal server error",
			},
		};
	}
}

export async function processArtifactRequest(artifactID: string): Promise<ArtifactProcessingResult> {
	try {
		if (artifactID.startsWith("G")) {
			return {
				success: false,
				error: {
					errorCode: 2,
					errorMessage: "User not found",
				},
			};
		}

		const person = await getPersonBySciper(artifactID);
		if (!person) {
			return {
				success: false,
				error: {
					errorCode: 2,
					errorMessage: "User not found",
				},
			};
		}
		else if (person === null) {
			return {
				success: false,
				error: {
					errorCode: 1,
					errorMessage: "Internal server error",
				},
			};
		}

		const { funds, travels } = await getUserArtifactData(artifactID);

		if (funds.length === 0 && travels.length === 0) {
			return {
				success: false,
				error: {
					errorCode: 3,
					errorMessage: "Employee has no invoice centre authorisations",
				},
			};
		}

		const kostenzuordnungen = [
			...funds.map(fund => fund.id),
			...travels.map(travel => travel.requestID.toString()),
		];

		const artifactResponse: ArtifactResponse = {
			artifactID,
			email: person.email,
			vertragsnummer: "EPFL776",
			rechnungsstellen: {
				bezeichnung: "EPFL",
				kostenzuordnungen,
			},
			sprache: "fr",
			telefonnummer: person?.phones?.length ? person.phones[0].number.replace(/^(\+41)(\d{2})(\d+)$/, "$1 $2 $3") : "+41 21 6931111",
			personalnummer: person.id,
			geschaeftsadresse: {
				firmaBez: "EPFL",
				strasse: "av Piccard",
				plz: "1015",
				ort: "Lausanne",
				land: "CH",
			},
		};

		return {
			success: true,
			data: artifactResponse,
		};
	} catch (error) {
		console.error("Error processing artifact request:", error);
		return {
			success: false,
			error: {
				errorCode: 1,
				errorMessage: "Internal server error",
			},
		};
	}
}
