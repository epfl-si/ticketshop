export function parseXML(data) {
	const parser = new XMLParser();
	data = parser.parse(data.replaceAll("ns2:", "").replaceAll("soap:", ""));
	return data;
};

const httpsAgent = new Agent({
	connect: {
		rejectUnauthorized: false
	}
});

export async function makeApiCall(body) {
	const url = `${process.env.JEST_HOSTNAME}/cgi-bin/artifactServer`;
	const response = await fetch(url,
		{
			method: "POST",
			body,
			dispatcher: httpsAgent
		}
	).then(response => response.text());
	return response;
}

export async function ultraXMLFormat(xml) {
	return xml.replaceAll(" ", "").replaceAll("\n", "").replaceAll("\t", "");
}

export async function assertArtifactServer(param) {
	test(`test for ${param}`, async(param) => {
		const responseSciperReceived = await makeApiCall(param);
		const responseSciperExpected = await makeApiCall(param);
		expect(responseSciperReceived).toBe(responseSciperExpected);
	});
}