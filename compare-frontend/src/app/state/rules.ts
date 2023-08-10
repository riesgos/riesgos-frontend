import { partition } from "rxjs";
import { RiesgosState, ScenarioName, PartitionName, ModalState, StepStateTypes } from "./state";

export type RuleSetName = 'selectOneScenario' | 'compareScenarios' | 'compareIdentical' | 'compareAdvanced' | 'classic';

export interface Rules {
    partition: boolean,
    mirrorStepFocus: (userChoiceMapsLinked: boolean | undefined) => boolean,
    mirrorOpacity: (userChoiceMapsLinked: boolean | undefined) => boolean,
    mirrorClick: (userChoiceMapsLinked: boolean | undefined, compositeId: string) => boolean,
    mirrorMove: (userChoiceMapsLinked: boolean | undefined) => boolean,
    mirrorWizard:  boolean,
    oneFocusOnly: boolean,
    focusFirstStepImmediately: boolean,
    mirrorData: boolean,
    mirrorReset: boolean,
    autoPilot: (stepId: string) => boolean,
    allowReset: (partition: PartitionName) => boolean,
    allowViewLinkToggling: boolean,
    allowConfiguration: (productId: string) => boolean,
    modal: (state: RiesgosState, scenarioName: ScenarioName, partition: PartitionName) => ModalState,
}

export function getRules(ruleSet: RuleSetName | undefined): Rules {
    let rules: Rules = {
        partition: true,
        mirrorStepFocus: (userChoiceMapsLinked) => userChoiceMapsLinked === undefined ? true : userChoiceMapsLinked,
        mirrorOpacity: (userChoiceMapsLinked) => userChoiceMapsLinked === undefined ? true : userChoiceMapsLinked,
        oneFocusOnly: true,
        focusFirstStepImmediately: true,
        mirrorData: false,
        mirrorClick: (userChoiceMapsLinked: boolean | undefined, compositeId: string) => userChoiceMapsLinked === true && compositeId !== 'userChoiceLayer',
        mirrorMove: userChoiceMapsLinked => userChoiceMapsLinked === undefined ? true : userChoiceMapsLinked,
        mirrorWizard: false,
        mirrorReset: false,
        allowReset: partition => true,
        allowViewLinkToggling: true,
        allowConfiguration: () => true,
        autoPilot: (stepId: string) => stepId !== "selectEq",
        modal: (state: RiesgosState, scenarioName: ScenarioName, partition: PartitionName) =>  ({ args: undefined }),
    };

    // This could become arbitrarily complicated. 
    // Might want to use an inference-engine.
    switch (ruleSet) {
        case 'selectOneScenario':
            rules.focusFirstStepImmediately = true;
            rules.partition = false;
            rules.allowConfiguration = (productId: string) => productId === "userChoice";
            break;
        case 'compareScenarios':
            rules.modal = (state, scenario, partition) => {
                if (partition === "right") {
                    if (!allStepsCompleted(state, scenario, "left")) return { args: { title: "", subtitle: "", body: "willActivateOnceLeftDone", closable: false }};
                }
                if (partition === "middle") {
                    if (allStepsCompleted(state, scenario, "left") && noStepsStarted(state, scenario, "right")) return { args: {title: "startRight", subtitle: "", body: "compareEqWithLeft", closable: true} };
                }
                return { args: undefined };
            }
            rules.mirrorClick = () => true;
            rules.mirrorMove = () => true;
            rules.mirrorStepFocus = () => true;
            rules.allowViewLinkToggling = false;
            break;
        case 'compareIdentical':
            rules.focusFirstStepImmediately = true;
            rules.mirrorData = true;
            rules.mirrorStepFocus = () => false;
            rules.mirrorMove = userChoiceMapsLinked => userChoiceMapsLinked === undefined ? false : userChoiceMapsLinked;
            rules.mirrorClick = userChoiceMapsLinked => userChoiceMapsLinked === undefined ? false : userChoiceMapsLinked;
            rules.mirrorReset = true;
            rules.allowConfiguration = (productId: string) => productId === "userChoice";
            rules.allowReset = partition => partition === 'left';
            rules.modal = (state, scenario, partition) => {
                if (partition === "right") {
                    if (!allStepsCompleted(state, scenario, "left")) return { args: { title: "", subtitle: "", body: "willActivateOnceLeftDone", closable: false }};
                }
                if (partition === "middle") {
                    if (allStepsCompleted(state, scenario, "left")) return { args: {title: "windowAvailable", subtitle: "", body: "compareIdenticalWithLeft", closable: true} };
                }
                return { args: undefined }
            }
            rules.allowViewLinkToggling = true;
            break;
        case 'compareAdvanced':
            rules.mirrorStepFocus = userChoiceMapsLinked => userChoiceMapsLinked === undefined ? true : userChoiceMapsLinked;
            rules.mirrorMove = userChoiceMapsLinked => userChoiceMapsLinked === undefined ? true : userChoiceMapsLinked;
            rules.mirrorClick = (userChoiceMapsLinked, compositeId) => false;
            rules.autoPilot = () => false;
            break;
        case 'classic':
            rules.partition = false;
            rules.oneFocusOnly = false;
            rules.autoPilot = () => false;
            break;
    }

    return rules;
}


function allStepsCompleted(state: RiesgosState, scenario: ScenarioName, partition: PartitionName) {
    const scenarioData = state.scenarioData[scenario];
    if (!scenarioData) return false;
    const partitionData = scenarioData[partition];
    if (!partitionData) return false;
    const steps = partitionData.steps;
    const states = steps.map(s => s.state.type);
    for (const state of states) {
        if (state !== StepStateTypes.completed) return false;
    }
    return true;
}


function noStepsStarted(state: RiesgosState, scenario: ScenarioName, partition: PartitionName) {
    const scenarioData = state.scenarioData[scenario];
    if (!scenarioData) return true;
    const partitionData = scenarioData[partition];
    if (!partitionData) return true;
    const steps = partitionData.steps;
    const states = steps.map(s => s.state.type);
    for (const state of states) {
        if (state === StepStateTypes.completed || state === StepStateTypes.running) return false;
    }
    return true;
}