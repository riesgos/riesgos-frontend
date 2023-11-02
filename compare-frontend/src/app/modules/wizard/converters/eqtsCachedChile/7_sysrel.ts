import { ScenarioName, RiesgosScenarioState, RiesgosProductResolved } from "src/app/state/state";
import { Converter } from "../../converter.service";
import { WizardComposite } from "../../wizard.service";
import { TranslatedImageComponent } from "../../tabComponents/legends/translated-image/translated-image.component";
import { TranslationService } from "src/app/services/translation.service";
import { Injectable } from "@angular/core";
import { MultiLegendComponent } from "../../tabComponents/legends/legendComponents/multi-legend/multi-legend.component";
import { LegendComponent } from "../../tabComponents/legends/legendComponents/legend/legend.component";

@Injectable()
export class CachedWizardSysRelChile implements Converter {

    constructor(private translate: TranslationService) {}

    applies(scenario: ScenarioName, step: string): boolean {
        return scenario === "ChileCached" && step === "SysRelChile";
    }

    getInfo(state: RiesgosScenarioState, data: RiesgosProductResolved[]): WizardComposite {
        const step = state.steps.find(s => s.step.id === "SysRelChile")!;
        const datum = data.find(d => d.id === "sysRelChile");
        if (!datum) return {hasFocus: false, inputs: [], step, layerControlables: [], oneLayerOnly: false};

        const wms = new URL(datum.value);
        const baseLegend = `${wms.origin}/${wms.pathname}?REQUEST=GetLegendGraphic&SERVICE=WMS&VERSION=1.1.1&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&LAYER=${wms.searchParams.get('LAYERS')}`;


        return {
            hasFocus: false, // doesn't matter what we set here - will be overridden by wizard-svc
            isAutoPiloted: false, // doesn't matter what we set here - will be overridden by wizard-svc
            layerControlables: [], // doesn't matter what we set here - will be overridden by wizard-svc
            oneLayerOnly: false,
            inputs: [],
            step,
            legend: () => {
                return {
                    component: MultiLegendComponent,
                    args: {
                        legendComponents: [{
                            component: TranslatedImageComponent,
                            args: {
                                title: this.translate.translate('Prob_Interuption'),
                                languageImageMap: {
                                    'EN': baseLegend + '&language=en',
                                    'ES': baseLegend + '',
                                }
                            }
                        }, {
                            component: LegendComponent,
                            args: {
                                title: 'Powerlines',
                                entries: [{
                                    text: 'Linea',
                                    color: `rgb(240, 149, 52)`,
                                }, {
                                    text: 'Derivacion',
                                    color: `rgb(230, 229, 69)`,
                                }],
                                continuous: false,
                                height: 60,
                                width: 150,
                            }
                        }, {
                            component: LegendComponent,
                            args: {
                                title: 'SIGRID water',
                                entries: [{
                                    text: 'Red primaria',
                                    color: `rgb(0, 0, 0)`,
                                }, {
                                    text: 'Red secundaria',
                                    color: `rgb(0, 95, 223)`,
                                }, {
                                    text: 'Alcantarillado',
                                    color: `rgb(208, 4, 248)`,
                                }],
                                continuous: false,
                                height: 80,
                                width: 150,
                            }
                        }],
                        direction: 'vertical'
                    }
                }
            }
        }
    }

}