"use server";
export async function getDfs(sciper: string) {
    const url = `${process.env.SAP_URL}/poq/RESTAdapter/api/fi/travelrequests`;
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;

    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();
    const filteredData = data.travelRequests.filter((travelRequest:{sciper:number}) => {
        return travelRequest.sciper === parseInt(sciper);
    });

    return filteredData;
}

export async function getFunds(sciper: string) {
    const url = `${process.env.API_URL}/v1/authorizations?persid=${sciper}&authid=railticket,ndf.travel.org&type=right&expand=1`;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();
    const result = data.authorizations.filter((auth:{resourceid: string}) => auth.resourceid.startsWith('FF'));
    if(!result.length) {
        return { error: `No funds found for sciper ${sciper}` };
    } else {
        return result;
    }
}

export async function getUsers(input: string) {
    const url = `${process.env.API_URL}/v1/persons?query=${input}`;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();
    return data.persons;
}