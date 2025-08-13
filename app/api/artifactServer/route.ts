import xpath from 'xpath';
import { DOMParser } from 'xmldom';
import { getUser, updateUser } from '@/app/lib/database';
import { Df, Fund, Setting } from '@/app/types/main';

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

function logRequest(user: number, requestType: string, success: boolean, payload: string) {
    console.log(`
{
    "user": ${user},
    "requestType": "${requestType}",
    "success": ${success}
    "payload": ${payload}
}
    `)
}

export async function POST(req: Request) {
    const xmlData = await req.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");

    const select = xpath.useNamespaces({
        'SOAP-ENV': 'http://schemas.xmlsoap.org/soap/envelope/',
        'ns3': 'http://xmlns.sbb.ch/zvs/splp/artifact'
    });
    const emailNodes = select('/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifactID/email', xmlDoc) as Node[];
    const email = emailNodes && emailNodes.length > 0 ? emailNodes[0].firstChild?.nodeValue : null;

    const artifactIDNodes = select('/SOAP-ENV:Envelope/SOAP-ENV:Body/ns3:getArtifact/artifactID/id', xmlDoc) as Node[];
    const artifactID = artifactIDNodes && artifactIDNodes.length > 0 ? artifactIDNodes[0].firstChild?.nodeValue : null;

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

            logRequest(artifactID, 'getArtifactID', true, xmlData);

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

            logRequest(parseInt(artifactID), 'getArtifact', false, xmlData);

            return new Response(responseXML, {
                status: 500,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

        await updateUser(artifactID);
        const user = await getUser(artifactID);

        const filteredFunds = (user?.funds as unknown as Fund[])?.filter((fund:Fund) => fund.id === user?.settings.find((s:Setting) => s.shown && s.fundId === fund.id)?.fundId);
        const filteredDfs = (user?.dfs as Df[])?.filter((df:Df) => df.id === user?.settings.find((s:Setting) => s.shown && s.dfId === df.id)?.dfId);

        if(user?.funds.length || user?.dfs.length) {
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
                                    ${filteredFunds?.map(fund => `<bezeichnung>${fund.resourceId}</bezeichnung>`).join('')}
                                    ${filteredDfs?.map(df => `<bezeichnung>${df.requestID}</bezeichnung>`).join('')}
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
    
            logRequest(parseInt(artifactID), 'getArtifact', true, xmlData)

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

            logRequest(parseInt(artifactID), 'getArtifact', false, xmlData)

            return new Response(responseXML, {
                status: 500,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

    }
}