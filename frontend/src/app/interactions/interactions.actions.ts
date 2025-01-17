import { createAction, props } from '@ngrx/store';
import { InteractionMode } from './interactions.state';
import { RiesgosProduct, ScenarioName } from '../riesgos/riesgos.state';


export const interactionStarted = createAction(
    '[Interactions] Interaction started',
    props<{mode: InteractionMode, scenario: ScenarioName, product: RiesgosProduct }>()
);


export const interactionCompleted = createAction(
    '[Interactions] Interaction completed',
    props<{scenario: ScenarioName, product: RiesgosProduct }>()
);

