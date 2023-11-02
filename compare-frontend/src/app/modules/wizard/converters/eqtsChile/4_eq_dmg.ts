import { ScenarioName, RiesgosScenarioState, RiesgosProductResolved } from "src/app/state/state";
import { Converter } from "../../converter.service";
import { WizardComposite } from "../../wizard.service";
import { TranslatedImageComponent } from "../../tabComponents/legends/translated-image/translated-image.component";
import { MultiLegendComponent } from "../../tabComponents/legends/legendComponents/multi-legend/multi-legend.component";


export class WizardEqDmgChile implements Converter {
    applies(scenario: ScenarioName, step: string): boolean {
        return scenario === "ChileShort" && step === "EqDamageChile";
    }

    getInfo(state: RiesgosScenarioState, data: RiesgosProductResolved[]): WizardComposite {
        const step = state.steps.find(s => s.step.id === "EqDamageChile")!;
        const wmsProduct = data.find(p => p.id === "eqDamageWmsChile");
        if (!wmsProduct) return { hasFocus: false, inputs: [], layerControlables: [], step: step, oneLayerOnly: true };

        const wms = new URL(wmsProduct.value);
        const baseLegendEcon = `${wms.origin}/${wms.pathname}?REQUEST=GetLegendGraphic&SERVICE=WMS&VERSION=1.1.1&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&LAYER=${wms.searchParams.get('layers')}&STYLES=default`;


        return {
            hasFocus: false, // doesn't matter what we set here - will be overridden by wizard-svc
            isAutoPiloted: false, // doesn't matter what we set here - will be overridden by wizard-svc
            layerControlables: [], // doesn't matter what we set here - will be overridden by wizard-svc
            oneLayerOnly: true,
            inputs: [],
            step,
            legend: () => ({
                component: MultiLegendComponent,
                args: {
                    legendComponents: [{
                        component: TranslatedImageComponent,
                        args: {
                            languageImageMap: {
                                'EN': baseLegendEcon + '&style=style-damagestate-sara-plasma&language=en',
                                'ES': baseLegendEcon + '&style=style-damagestate-sara-plasma',
                            }
                        }
                    }, {
                        component: TranslatedImageComponent,
                        args: {
                            languageImageMap: {
                                'EN': baseLegendEcon + '&style=style-cum-loss-chile-plasma&language=en',
                                'ES': baseLegendEcon + '&style=style-cum-loss-chile-plasma',
                            }
                        }
                    }]
                }
            }),
        };
    }

}