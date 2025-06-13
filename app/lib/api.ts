export async function getDfs(sciper: string) {
    const url = `https://testsapservices.epfl.ch/poq/RESTAdapter/api/fi/travelrequests`;
    const username = process.env.DFS_USERNAME;
    const password = process.env.DFS_PASSWORD;

    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    const response = await fetch(url, { method: 'GET', headers: headers });

    const data = await response.json();
    const filteredData = data.travelRequests.filter((travelRequest: any) => {
        return travelRequest.sciper === parseInt(sciper);
    });

    return filteredData;
}