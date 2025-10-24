import { ApiFund, ApiTravel } from "./api";

export interface ArtifactRequest {
	email?: string;
	artifactID?: string;
}

export interface ArtifactIDResponse {
	artifactID: string;
}

export interface PersonData {
	id: string;
	email: string;
	phones: Array<{ number: string }>;
}

export interface ArtifactResponse {
	artifactID: string;
	email: string;
	vertragsnummer: string;
	rechnungsstellen: {
		bezeichnung: string;
		kostenzuordnungen: string[];
	};
	sprache: string;
	telefonnummer: string;
	personalnummer: string;
	geschaeftsadresse: {
		firmaBez: string;
		strasse: string;
		plz: string;
		ort: string;
		land: string;
	};
}

export interface SoapError {
	errorCode: number;
	errorMessage: string;
}

export interface ArtifactProcessingResult {
	success: boolean;
	data?: ArtifactIDResponse | ArtifactResponse;
	error?: SoapError;
}

export interface UserArtifactData {
	funds: ApiFund[];
	travels: ApiTravel[];
}

export interface ArtifactLog {
	user: number;
	requestType: "getArtifactID" | "getArtifact";
	success: boolean;
	payload: string;
}