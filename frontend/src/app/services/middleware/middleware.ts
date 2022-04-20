import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { WpsVersion, WpsData, WpsDataDescription } from '../wps/wps.datatypes';



async function sleep(sleepTime: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, sleepTime); 
    });
}

export interface ExecuteData {
    version: WpsVersion,
    inputs: WpsData[],
    outputDescriptions: WpsDataDescription[],
    processId: string,
    url: string
}

export async function execute(data: ExecuteData, httpClient: HttpClient) {
    const reference: any = await httpClient.post(`${environment.middlewareUrl}/execute`, data, {headers: {'Content-Type': 'application/json'}}).toPromise();
    let results = null;
    while(!results) {
        await sleep(3000);
        results = await httpClient.get(`${environment.middlewareUrl}/execute/${reference.id}`).toPromise();
    }
    if (results.error) throw new Error(results.error);
    return results;
}