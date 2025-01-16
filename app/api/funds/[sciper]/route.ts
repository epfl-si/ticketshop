export async function GET(request: Request, { params }: { params: { sciper: string } }) {
    const { sciper } = await params;
    const url = `https://api.epfl.ch/v1/authorizations?persid=${sciper}&authid=railticket,ndf.travel.org&type=right&expand=1`;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();
    const result = data.authorizations.filter((auth: any) => auth.resourceid.startsWith('FF'));
    if(!result.length) {
        return new Response(JSON.stringify({ error: `No funds found for sciper ${sciper}` }), {
            headers: { 'Content-Type': 'application/json' },
            status: 404
        });
    } else {
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    }
}