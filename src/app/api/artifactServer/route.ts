import { parseArtifactRequest, generateArtifactIDResponse, generateArtifactResponse, generateSoapFault, createXmlResponse } from "@/lib/soap";
import { processArtifactIDRequest, processArtifactRequest } from "@/services/artifact";
import { ArtifactIDResponse, ArtifactResponse } from "@/types/artifact";
import { syncUserData } from "@/lib/database";

import log from "@/services/log";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	const requestId = crypto.randomUUID();
	try {
		const xmlData = await req.text();
		const request = parseArtifactRequest(xmlData);

		const cookieStore = await cookies();
		cookieStore.set("requestId", requestId);

		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: xmlData, direction: "inband", ip: req.headers.get("x-forwarded-for"), requestId });

		// XML SOAP response telling the CFF if the EPFL user has the railticket (accred) right.
		if (request.email) {
			const result = await processArtifactIDRequest(request.email);
			let status = 501;
			let soap = "";

			if (result.success && result.data) {
				await syncUserData(result.data.artifactID);
				soap = generateArtifactIDResponse(result.data as ArtifactIDResponse);
				status = 200;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: soap, direction: "outband", status: status, ip: req.headers.get("x-forwarded-for"), requestId });
			} else if (result.error) {
				// User doesn't find or internal server error when calling api
				soap = generateSoapFault(result.error);
				status = 500;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: soap, direction: "outband", status: status, ip: req.headers.get("x-forwarded-for"), requestId });
			}
			const event = "artifactserver.getArtifactID";
			await log.event({
				event,
				details: `Display ${request.artifactID}'s funds`,
				metadata: {
					target: request.email,
					result: result.data?.artifactID,
					status,
					request,
					error: {
						errorMessage: result?.error?.errorMessage || "",
						errorCode: result?.error?.errorCode || "",
					},
					soapRequest: xmlData,
					soapResponse: soap,
				},
			});
			return createXmlResponse(soap, status);
		}

		// XML SOAP response with EPFL user's fund(s) to the CFF HTTP request.
		if (request.artifactID) {
			const artifactID = String(request.artifactID);
			await syncUserData(artifactID);
			const result = await processArtifactRequest(artifactID);
			let status = 501;
			let soap = "";
			let itemCount = -1;

			if (result.success && result.data) {
				soap = generateArtifactResponse(result.data as ArtifactResponse);
				status = 200;
				itemCount = (result.data as ArtifactResponse).rechnungsstellen.kostenzuordnungen.length;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: soap, direction: "outband", status, ip: req.headers.get("x-forwarded-for"), requestId });
			} else if (result.error) {
				// User doesn't have funds
				soap = generateSoapFault(result.error);
				status = 500;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: soap, direction: "outband", status, ip: req.headers.get("x-forwarded-for"), requestId });
			}

			const event = "artifactserver.getArtifact";
			await log.event({
				event,
				details: `Display ${request.artifactID}'s funds`,
				metadata: {
					target: request.artifactID,
					status,
					request,
					itemCount,
					error: {
						errorMessage: result?.error?.errorMessage || "",
						errorCode: result?.error?.errorCode || "",
					},
					soapRequest: xmlData,
					soapResponse: soap,
				},
			});

			return createXmlResponse(soap, status);
		}

		// XML SOAP response telling the CFF if a parameter is missing.
		if (!request.email || !request.artifactID) {
			const result = {
				error: {
					errorCode: 21 as number,
					errorMessage: "Missing parameter" as string,
				},
			};
			const errorXML = generateSoapFault(result.error);
			log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: errorXML, direction: "outband", status: 500, ip: req.headers.get("x-forwarded-for"), requestId });
			return createXmlResponse(errorXML, 500);
		}

		const errorXML = generateSoapFault({
			errorCode: 1,
			errorMessage: "Invalid request format",
		});
		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: errorXML, direction: "outband", status: 400, ip: req.headers.get("x-forwarded-for"), requestId });
		return createXmlResponse(errorXML, 400);
	} catch (error) {
		console.error("Error processing artifact request:", error);
		const errorXML = generateSoapFault({
			errorCode: 1,
			errorMessage: "Internal server error",
		});
		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(error), soap: errorXML, direction: "outband", status: 400, ip: req.headers.get("x-forwarded-for"), requestId });
		return createXmlResponse(errorXML, 500);
	}
}
