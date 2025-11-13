import xpath from "xpath";
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser'

import { ArtifactRequest, ArtifactIDResponse, ArtifactResponse, SoapError } from "@/types/artifact";

function parseParsedXML(data:any) {
	data = Object.keys(data)
		.reduce((obj: any, key: string) => {
			let value = data[key]
			if (data[key] instanceof Object) {
				value = parseParsedXML(data[key])
			}
			obj[key.replace("SOAP-ENV:", "").replace("ns3:", "").toLowerCase()] = value;
			return obj;
		}, {})
	return data;
}

export function parseArtifactRequest(xmlData: string): ArtifactRequest {
	const parser = new XMLParser();
	let xmlDoc = parseParsedXML(parser.parse(xmlData));

	const email = xmlDoc?.envelope?.body?.getartifact?.artifactid?.email;
	const artifactID = String(xmlDoc?.envelope?.body?.getartifact?.artifactid?.id);

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
