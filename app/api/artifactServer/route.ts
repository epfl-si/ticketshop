/*
The XML for getArtifactID is:

<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Header/>
    <SOAP-ENV:Body>
        <ns3:getArtifactID xmlns:ns3="http://xmlns.sbb.ch/zvs/splp/artifact">
            <email>$email</email>
            <vertragsnummer>EPFL776</vertragsnummer>
        </ns3:getArtifactID>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>

*/

/*
The XML for getArtifact is:

<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Header/>
    <SOAP-ENV:Body>
        <ns3:getArtifact xmlns:ns3="http://xmlns.sbb.ch/zvs/splp/artifact">
            <artifactID>
                <id>$sciper</id>
            </artifactID>
        </ns3:getArtifact>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>

*/

import xpath from 'xpath';
import { DOMParser } from 'xmldom';

async function getPersonByEmail(email: string) {
    const url = `https://api.epfl.ch/v1/persons?query=${email}`;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();

    return data.persons
}

async function getPersonBySciper(sciper: string) {
    const url = `https://api.epfl.ch/v1/persons/${sciper}`;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();

    return data
}

export async function POST(req: Request) {
    const xmlData = await req.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");

    const select = xpath.useNamespaces({
        'SOAP-ENV': 'http://schemas.xmlsoap.org/soap/envelope/',
        'ns3': 'http://xmlns.sbb.ch/zvs/splp/artifact'
    });
    const emailNodes = select('/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifactID/email', xmlDoc);
    const email = emailNodes && emailNodes.length > 0 ? emailNodes[0].firstChild.nodeValue : null;

    const artifactIDNodes = select('/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifact/artifactID/id', xmlDoc);
    const artifactID = artifactIDNodes && artifactIDNodes.length > 0 ? artifactIDNodes[0].firstChild.nodeValue : null;

    if(email) {
        const persons = await getPersonByEmail(email);
        
        if(persons.length) {
            const person = persons[0];
            const artifactID = person.id;
            const responseXML = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <ns2:getArtifactIDResponse xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                        <return>
                            <artifactID>
                                <id>${artifactID}</id>
                            </artifactID>
                        </return>
                    </ns2:getArtifactIDResponse>
                </soap:Body>
            </soap:Envelope>
            `;

            return new Response(responseXML, {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            });
        } else {
            const responseXML = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <soap:Fault>
                        <faultcode>soap:Server</faultcode>
                        <faultstring>Fault occurred while processing.</faultstring>
                        <detail>
                            <ns2:faultMessage xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                                <errors>
                                    <errorCode>2</errorCode>
                                    <errorMessage>User not found</errorMessage>
                                </errors>
                            </ns2:faultMessage>
                        </detail>
                    </soap:Fault>
                </soap:Body>
            </soap:Envelope>
            `;

            return new Response(responseXML, {
                status: 500,
                headers: { 'Content-Type': 'application/xml' },
            });
        }
    } else if (artifactID) {
        const person = await getPersonBySciper(artifactID);
        if(!person || artifactID.startsWith('G')) {
            const responseXML = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <soap:Fault>
                        <faultcode>soap:Server</faultcode>
                        <faultstring>Fault occurred while processing.</faultstring>
                        <detail>
                            <ns2:faultMessage xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                                <errors>
                                    <errorCode>2</errorCode>
                                    <errorMessage>User not found</errorMessage>
                                </errors>
                            </ns2:faultMessage>
                        </detail>
                    </soap:Fault>
                </soap:Body>
            </soap:Envelope>
            `;

            return new Response(responseXML, {
                status: 500,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

        await fetch(`${process.env.APP_URL}/api/updateUser`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sciper: parseInt(artifactID) }),
        });
        const user = await fetch(`${process.env.APP_URL}/api/getUser/${artifactID}`);
        const userData = await user.json();

        const filteredFunds = userData.funds.filter((fund:any) => fund.id === userData.settings.find((s:any) => s.shown && s.fundId === fund.id)?.fundId);
        const filteredDfs = userData.dfs.filter((df:any) => df.id === userData.settings.find((s:any) => s.shown && s.dfId === df.id)?.dfId);

        if(userData.funds.length || userData.dfs.length) {
            const responseXML = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <ns2:getArtifactResponse xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                        <return>
                            <artifactID>
                                <id>${artifactID}</id>
                            </artifactID>
                            <email>${person.email}</email>
                            <vertragsnummer>EPFL776</vertragsnummer>
                            <rechnungsstellen>
                                <bezeichnung>EPFL</bezeichnung>
                                <kostenzuordnungen>
                                    ${filteredFunds.map((fund:any) => `<bezeichnung>${fund.resourceId}</bezeichnung>`).join('')}
                                    ${filteredDfs.map((df:any) => `<bezeichnung>${df.requestID}</bezeichnung>`).join('')}
                                </kostenzuordnungen>
                            </rechnungsstellen>
                            <sprache>fr</sprache>
                            <telefonnummer>${person.phones[0].number}</telefonnummer>
                            <personalnummer>${person.id}</personalnummer>
                            <geschaeftsadresse>
                                <firmaBez>EPFL</firmaBez>
                                <strasse>av Piccard</strasse>
                                <plz>1015</plz>
                                <ort>Lausanne</ort>
                                <land>CH</land>
                            </geschaeftsadresse>
                        </return>
                    </ns2:getArtifactResponse>
                </soap:Body>
            </soap:Envelope>
            `;  
    
            return new Response(responseXML, {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            });
        } else {
            const responseXML = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <soap:Fault>
                        <faultcode>soap:Server</faultcode>
                        <faultstring>Fault occurred while processing.</faultstring>
                        <detail>
                            <ns2:faultMessage xmlns:ns2="http://xmlns.sbb.ch/zvs/splp/artifact">
                                <errors>
                                    <errorCode>3</errorCode>
                                    <errorMessage>Employee has no invoice centre authorisations</errorMessage>
                                </errors>
                            </ns2:faultMessage>
                        </detail>
                    </soap:Fault>
                </soap:Body>
            </soap:Envelope>
            `;

            return new Response(responseXML, {
                status: 500,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

    }
}