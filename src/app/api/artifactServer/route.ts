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

		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: xmlData, direction: "inband", ip: req.headers.get("x-forwarded-for") ?? "", requestId });

		// XML SOAP response telling the CFF if the EPFL user has the railticket (accred) right.
		if (request.email) {
			const result = await processArtifactIDRequest(request.email);
			let status = 501;
			let soap = "";
			const sciper = result.data?.artifactID;

			if (result.success && sciper) {
				await syncUserData(sciper);
				soap = generateArtifactIDResponse(result.data as ArtifactIDResponse);
				status = 200;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: soap, direction: "outband", status: status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
			} else if (result.error) {
				soap = generateSoapFault(result.error);
				status = result.error.errorCode === 2 ? 200 : 500;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: soap, direction: "outband", status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
			}

			await log.event({
				event: "artifactserver.getArtifactID",
				userId: sciper,
				details: `getArtifactID ${request.email}`,
				metadata: {
					email: request.email,
					sciper: sciper ?? "",
					status,
					request,
					...(result.error && {
						error: {
							errorMessage: result.error.errorMessage,
							errorCode: result.error.errorCode,
						},
					}),
					soapRequest: xmlData,
					soapResponse: soap,
				},
			});
			return createXmlResponse(soap, status);
		}

		// XML SOAP response with EPFL user's fund(s) to the CFF HTTP request.
		if (request.artifactID) {
			const sciper = String(request.artifactID);
			const result = await processArtifactRequest(sciper);
			let status = 501;
			let soap = "";
			let itemCount = 0;

			if (result.success && result.data) {
				soap = generateArtifactResponse(result.data as ArtifactResponse);
				status = 200;
				itemCount = (result.data as ArtifactResponse).rechnungsstellen.kostenzuordnungen.length;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: soap, direction: "outband", status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
			} else if (result.error) {
				soap = generateSoapFault(result.error);
				status = 200;
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: soap, direction: "outband", status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
			}

			await log.event({
				event: "artifactserver.getArtifact",
				userId: sciper,
				details: `getArtifact ${sciper}`,
				metadata: {
					sciper,
					status,
					request,
					itemCount,
					...(result.error && {
						error: {
							errorMessage: result.error.errorMessage,
							errorCode: result.error.errorCode,
						},
					}),
					soapRequest: xmlData,
					soapResponse: soap,
				},
			});

			return createXmlResponse(soap, status);
		}

		// Missing parameter
		const status = 200;
		const errorXML = generateSoapFault({
			errorCode: 21,
			errorMessage: "Missing parameter",
		});
		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: "Missing parameter", soap: errorXML, direction: "outband", status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
		return createXmlResponse(errorXML, status);
	} catch (error) {
		const status = 500;
		console.error("Error processing artifact request:", error);
		const errorXML = generateSoapFault({
			errorCode: 1,
			errorMessage: "Internal server error",
		});
		log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(error), soap: errorXML, direction: "outband", status, ip: req.headers.get("x-forwarded-for") ?? "", requestId });
		return createXmlResponse(errorXML, status);
	}
}
