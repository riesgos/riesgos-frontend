import path from 'path';
import objectHash from 'object-hash';
import { DatumReference, Datum } from './scenarios';
import { createDirIfNotExists, pathJoin, readJsonFile, writeJsonFile, writeTextFile } from '../utils/files';

export class ScenarioToFileStorageConnector {

    constructor(private localPath: string, private fileAccessUrl: string) {
        if (!fileAccessUrl.endsWith('/')) this.fileAccessUrl += '/';
    }

    public async getDatum(datumReference: DatumReference): Promise<Datum> {
        const url = datumReference.reference;
        const fileName = url.substring(url.lastIndexOf('/'));
        const fullFilePath = pathJoin([this.localPath, fileName]);
        const datumValue = await readJsonFile(fullFilePath);
        return {
            id: datumReference.id,
            value: datumValue
        };
    }

    public async addDatum(datum: Datum): Promise<DatumReference> {
        const key = objectHash(datum);
        const fileName = key + '.json';
        const fullFilePath = pathJoin([this.localPath, fileName]);
        const fileUrl = `${this.fileAccessUrl}/${datum.id}/${fileName}`;
        await writeJsonFile(fullFilePath, datum.value);
        return {
            id: datum.id,
            reference: fileUrl
        }
    }
}
