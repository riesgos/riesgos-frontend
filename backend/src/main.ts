import config from "./config.json";
import cors from 'cors';
import express from 'express';
import { addScenarioApi } from './scenarios/scenario.interface';
// import { parseCode } from './parser/scenarioParser';
import { peruFactory } from './usr/peru/peru';
import { peruShortFactory } from './usr/peru_short/peru';
import { chileFactory } from './usr/chile/chile';
import { ecuadorFactory } from './usr/ecuador/ecuador';


const port = config.port;
const logDir = `./data/logs/`;   // server-logs
const storeDir = `./data/store/`;  // files that must be available to outside
const scriptDir = './data/scenarios';  // user-defined logic



async function main() {
    const app = express();
    app.use(cors());
    
    // const scenarioFactories = await parseCode(scriptDir);
    const scenarioFactories = [chileFactory, ecuadorFactory, peruFactory, peruShortFactory];

    addScenarioApi(app, scenarioFactories, storeDir, logDir, 'verbose', true);
    const server = app.listen(port, () => console.log(`app now listening on port ${port}`));
}

main();
