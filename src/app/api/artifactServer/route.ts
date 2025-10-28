import { parseArtifactRequest, generateArtifactIDResponse, generateArtifactResponse, generateSoapFault, createXmlResponse } from "@/lib/soap";
import { processArtifactIDRequest, processArtifactRequest } from "@/services/artifact";
import { ArtifactIDResponse, ArtifactResponse } from "@/types/artifact";

export async function POST(req: Request) {
	try {
		const xmlData = await req.text();
		const request = parseArtifactRequest(xmlData);

		if (request.email) {
			const result = await processArtifactIDRequest(request.email, xmlData);

			if (result.success && result.data) {
				const responseXML = generateArtifactIDResponse(result.data as ArtifactIDResponse);
				return createXmlResponse(responseXML, 200);
			} else if (result.error) {
				const errorXML = generateSoapFault(result.error);
				return createXmlResponse(errorXML, 500);
			}
		}

		if (request.artifactID) {
			const result = await processArtifactRequest(request.artifactID, xmlData);

			if (result.success && result.data) {
				const responseXML = generateArtifactResponse(result.data as ArtifactResponse);
				return createXmlResponse(responseXML, 200);
			} else if (result.error) {
				const errorXML = generateSoapFault(result.error);
				return createXmlResponse(errorXML, 500);
			}
		}

		const errorXML = generateSoapFault({
			errorCode: 1,
			errorMessage: "Invalid request format",
		});
		return createXmlResponse(errorXML, 400);
	} catch (error) {
		console.error("Error processing artifact request:", error);
		const errorXML = generateSoapFault({
			errorCode: 1,
			errorMessage: "Internal server error",
		});
		return createXmlResponse(errorXML, 500);
	}
}
