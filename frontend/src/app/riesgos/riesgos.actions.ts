import { createAction, props } from '@ngrx/store';
import { RiesgosProduct, RiesgosScenarioMetadata, ScenarioName } from './riesgos.state';



export const scenariosLoaded = createAction(
    '[Riesgos] Scenarios loaded',
    props<{ scenarios: RiesgosScenarioMetadata[] }>()
);

export const scenarioChosen = createAction(
    '[Riesgos] Scenario chosen',
    props<{scenario: ScenarioName}>()
);

export const executeStart = createAction(
    '[Riesgos] execute start',
    props<{scenario: ScenarioName, step: string, data: RiesgosProduct[]}>()
);

export const executeSuccess = createAction(
    '[Riesgos] execute success',
    props<{scenario: ScenarioName, step: string, newData: RiesgosProduct[]}>()
);

export const executeError = createAction(
    '[Riesgos] execute error',
    props<{scenario: ScenarioName, step: string, error: Error}>()
);

export const userDataProvided = createAction(
    '[Riesgos] user-data provided',
    props<{scenario: ScenarioName, products: any}>()
);

export const restartingFromStep = createAction(
    '[Riesgos] Restarting from step',
    props<{step: string}>()
);

export const restartingScenario = createAction(
    '[Riesgos] Restarting scenario',
    props<{scenario: ScenarioName}>()
);

