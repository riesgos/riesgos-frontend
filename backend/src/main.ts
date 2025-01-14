import express from 'express';
import {
    ScenarioAPIConfig,
    addScenarioApi,
} from './scenarios/scenario.interface';
// import { parseCode } from './parser/scenarioParser';
import config from './config.json';
import { chileFactory } from './usr/chile/chile';
import { chileCachedFactory } from './usr/chile_cached/chile';
import { chileShortFactory } from './usr/chile_short/chileShort';
import { ecuadorFactory } from './usr/ecuador/ecuador';
import { peruFactory } from './usr/peru/peru';
import { peruCachedFactory } from './usr/peru_cached/peru';
import { peruShortFactory } from './usr/peru_short/peru';

const port = config.port;

const configuration: ScenarioAPIConfig = {
    logDir: config.logDir,
    storeDir: config.storeDir,
    maxStoreLifeTimeMinutes: parseInt(config.maxStoreLifeTimeMinutes),
    sender: config.sender || 'info@test.com',
    sendMailTo: config.sendMailTo.split(','),
    maxLogAgeMinutes: parseInt(config.maxLogAgeMinutes),
    verbosity: config.verbosity === 'silent' ? 'silent' : 'verbose',
};

async function main() {
    // Setting up express
    const app = express();
    // app.use(cors()); <-- not necessary; already done by reverse proxy

    // const scenarioFactories = await parseCode(scriptDir);
    const scenarioFactories = [
        chileFactory,
        chileShortFactory,
        chileCachedFactory,
        ecuadorFactory,
        peruFactory,
        peruShortFactory,
        peruCachedFactory,
    ];

    // Checking that all scenarios are ready
    // for (const factory of scenarioFactories) {
    //     let ready: boolean | string = false;
    //     while (ready !== true) {
    //         ready = await factory.verifyConditions();
    //         if (ready !== true) {
    //             console.error(`ScenarioFactory "${factory.id}" not yet ready: ${ready}`);
    //             sleep(1000);
    //         }
    //     }
    // }

    // Adding API-endpoints to express app
    addScenarioApi(app, scenarioFactories, configuration);
    const server = app.listen(port, () =>
        console.log(`app now listening on port ${port}`)
    );
}

main();
