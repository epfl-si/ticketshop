import { parseArtifactRequest, generateArtifactIDResponse, generateArtifactResponse, generateSoapFault, createXmlResponse } from "@/lib/soap";
import { processArtifactIDRequest, processArtifactRequest } from "@/services/artifact";
import { ArtifactIDResponse, ArtifactResponse } from "@/types/artifact";

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

		if (request.email) {
			const result = await processArtifactIDRequest(request.email, xmlData);

			if (result.success && result.data) {
				const responseXML = generateArtifactIDResponse(result.data as ArtifactIDResponse);
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: responseXML, direction: "outband", status: 200, ip: req.headers.get("x-forwarded-for"), requestId });
				return createXmlResponse(responseXML, 200);
			} else if (result.error) {
				const errorXML = generateSoapFault(result.error);
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: errorXML, direction: "outband", status: 500, ip: req.headers.get("x-forwarded-for"), requestId });
				return createXmlResponse(errorXML, 500);
			}
		}

		if (request.artifactID) {
			const result = await processArtifactRequest(request.artifactID, xmlData);

			if (result.success && result.data) {
				const responseXML = generateArtifactResponse(result.data as ArtifactResponse);
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", soap: responseXML, direction: "outband", status: 200, ip: req.headers.get("x-forwarded-for"), requestId });
				return createXmlResponse(responseXML, 200);
			} else if (result.error) {
				const errorXML = generateSoapFault(result.error);
				log.soap({ endpoint: "/api/artifactServer", action: "artifactServer", method: "POST", message: String(result.error), soap: errorXML, direction: "outband", status: 500, ip: req.headers.get("x-forwarded-for"), requestId });
				return createXmlResponse(errorXML, 500);
			}
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
