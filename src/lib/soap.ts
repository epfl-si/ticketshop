import xpath from "xpath";
import { DOMParser } from "xmldom";
import { ArtifactRequest, ArtifactIDResponse, ArtifactResponse, SoapError } from "@/types/artifact";

export function parseArtifactRequest(xmlData: string): ArtifactRequest {
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlData, "application/xml");

	const select = xpath.useNamespaces({
		"SOAP-ENV": "http://schemas.xmlsoap.org/soap/envelope/",
		"ns3": "http://xmlns.sbb.ch/zvs/splp/artifact",
	});

	const emailNodes = select("/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifactID/email", xmlDoc) as Node[];
	const email = emailNodes && emailNodes.length > 0 ? emailNodes[0].firstChild?.nodeValue : null;

	const artifactIDNodes = select("/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifact/artifactID/id", xmlDoc) as Node[];
	const artifactID = artifactIDNodes && artifactIDNodes.length > 0 ? artifactIDNodes[0].firstChild?.nodeValue : null;

	return {
		email: email || undefined,
		artifactID: artifactID || undefined,
	};
}

export function generateArtifactIDResponse(data: ArtifactIDResponse): string {
	return `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:getArtifactIDResponse xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
            <return>
                <id>${data.artifactID}</id>
            </return>
        </ns2:getArtifactIDResponse>
    </soap:Body>
</soap:Envelope>
    `.trim();
}

export function generateArtifactResponse(data: ArtifactResponse): string {
	const kostenzuordnungen = data.rechnungsstellen.kostenzuordnungen
		.map(kz => `<kostenzuordnungen><bezeichnung>${kz}</bezeichnung></kostenzuordnungen>`)
		.join("");

	return `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:getArtifactResponse xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
            <return>
                <artifactID>
                    <id>${data.artifactID}</id>
                </artifactID>
                <email>${data.email}</email>
                <vertragsnummer>${data.vertragsnummer}</vertragsnummer>
                <rechnungsstellen>
                    <bezeichnung>${data.rechnungsstellen.bezeichnung}</bezeichnung>
                    ${kostenzuordnungen}
                </rechnungsstellen>
                <sprache>${data.sprache}</sprache>
                <telefonnummer>${data.telefonnummer}</telefonnummer>
                <personalnummer>${data.personalnummer}</personalnummer>
                <geschaeftsadresse>
                    <firmaBez>${data.geschaeftsadresse.firmaBez}</firmaBez>
                    <strasse>${data.geschaeftsadresse.strasse}</strasse>
                    <plz>${data.geschaeftsadresse.plz}</plz>
                    <ort>${data.geschaeftsadresse.ort}</ort>
                    <land>${data.geschaeftsadresse.land}</land>
                </geschaeftsadresse>
            </return>
        </ns2:getArtifactResponse>
    </soap:Body>
</soap:Envelope>
    `.trim();
}

export function generateSoapFault(error: SoapError): string {
	return `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>soap:Server</faultcode>
            <faultstring>Fault occurred while processing.</faultstring>
            <detail>
                <ns2:faultMessage xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                    <errors>
                        <errorCode>${error.errorCode}</errorCode>
                        <errorMessage>${error.errorMessage}</errorMessage>
                    </errors>
                </ns2:faultMessage>
            </detail>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
    `.trim();
}

export function createXmlResponse(xmlContent: string, status: number = 200): Response {
	return new Response(xmlContent, {
		status,
		headers: { "Content-Type": "text/xml; charset=utf-8" },
	});
}