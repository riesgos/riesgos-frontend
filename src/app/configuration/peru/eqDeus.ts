import { WpsProcess, ProcessStateUnavailable, Product, ExecutableProcess, ProcessState } from 'src/app/wps/wps.datatypes';
import { schemaPeru, initialExposurePeru } from './exposure';
import { WpsData } from 'projects/services-wps/src/public-api';
import { WizardableProcess, WizardProperties } from 'src/app/components/config_wizard/wizardable_processes';
import { VectorLayerData } from 'src/app/components/map/mappable_wpsdata';
import { Style as olStyle, Fill as olFill, Stroke as olStroke, Circle as olCircle, Text as olText } from 'ol/style';
import { Feature as olFeature } from 'ol/Feature';
import { createBarchart, Bardata, createConfusionMatrix } from 'src/app/helpers/d3charts';
import { redGreenRange, ninetyPercentLowerThan, toDecimalPlaces, damageRage, greenRedRange } from 'src/app/helpers/colorhelpers';
import { HttpClient } from '@angular/common/http';
import { fragilityRefPeru, VulnerabilityModelPeru, assetcategoryPeru, losscategoryPeru, taxonomiesPeru } from './modelProp';
import { eqShakemapRefPeru } from './shakyground';
import { Observable } from 'rxjs';
import { Deus } from '../chile/deus';
import { switchMap } from 'rxjs/operators';
import { FeatureCollection } from '@turf/helpers';
import { createKeyValueTableHtml, createHeaderTableHtml, createTableHtml } from 'src/app/helpers/others';




export const lossPeru: WpsData & Product = {
    uid: 'lossPeru',
    description: {
        id: 'loss',
        reference: false,
        type: 'literal'
    },
    value: 'testinputs/loss_sara.json'
};

export const eqDamagePeru: VectorLayerData & WpsData & Product = {
    uid: 'damagePeru',
    description: {
        id: 'damage',
        icon: 'dot-circle',
        reference: false,
        type: 'complex',
        format: 'application/json',
        name: 'eq-damage',
        vectorLayerAttributes: {
            style: (feature: olFeature, resolution: number) => {
                const props = feature.getProperties();
                const [r, g, b] = redGreenRange(0, 1, props.loss_value);
                return new olStyle({
                  fill: new olFill({
                    color: [r, g, b, 0.3],
                  }),
                  stroke: new olStroke({
                    color: [r, g, b, 1],
                    witdh: 2
                  })
                });
            },
            text: (props: object) => {
                return `<h4>Pérdida ${props['name']}</h4><p>${toDecimalPlaces(props['loss_value'] / 1000000, 2)} M${props['loss_unit']}</p>`;
            },
            summary: (value: [FeatureCollection]) => {
                const features = value[0].features;
                const damages = features.map(f => f.properties['loss_value']);
                const totalDamage = damages.reduce((carry, current) => carry + current, 0);
                const totalDamageFormatted = toDecimalPlaces(totalDamage / 1000000, 2) + ' MUSD';
                return createKeyValueTableHtml('', {'daño total': totalDamageFormatted});
            }
        },
        description: 'Concrete damage in USD.'
    },
    value: null
};

export const eqTransitionPeru: VectorLayerData & WpsData & Product = {
    uid: 'transitionPeru',
    description: {
        id: 'transition',
        reference: false,
        icon: 'dot-circle',
        type: 'complex',
        format: 'application/json',
        name: 'eq-transition',
        vectorLayerAttributes: {
            style: (feature: olFeature, resolution: number) => {
                const props = feature.getProperties();

                const counts = Array(5).fill(0);
                const nrBuildings = props['transitions']['n_buildings'];
                const states = props['transitions']['to_damage_state'];
                for (let i = 0; i < states.length; i++) {
                    const nr = nrBuildings[i];
                    const state = states[i];
                    counts[state] += nr;
                }

                const [r, g, b] = greenRedRange(0, 5, ninetyPercentLowerThan(Object.values(counts)));

                return new olStyle({
                  fill: new olFill({
                    color: [r, g, b, 0.3],
                  }),
                  stroke: new olStroke({
                    color: [r, g, b, 1],
                    witdh: 2
                  })
                });
            },
            text: (props: object) => {

                const matrix = Array.from(Array(5), _ => Array(5).fill(0));
                const fromDamageState = props['transitions']['from_damage_state'];
                const nrBuildings = props['transitions']['n_buildings'];
                const toDamageState = props['transitions']['to_damage_state'];
                for (let i = 0; i < fromDamageState.length; i++) {
                    const r = fromDamageState[i];
                    const c = toDamageState[i];
                    const nr = nrBuildings[i];
                    matrix[r][c] += nr;
                }

                const labeledMatrix = Array.from(Array(matrix.length + 1), _ => Array(matrix.length + 1).fill(''));
                for (let r = 0; r < labeledMatrix.length; r++) {
                    for (let c = 0; c < labeledMatrix[0].length; c++) {
                        if (r === 0 && c === 0) {
                            labeledMatrix[r][c] = '<b>from/to</b>';
                        } else if (r === 0) {
                            labeledMatrix[r][c] = `<b>${c - 1}</b>`;
                        } else if (c === 0) {
                            labeledMatrix[r][c] = `<b>${r - 1}</b>`;
                        } else if (r > 0 && c > 0) {
                            labeledMatrix[r][c] = toDecimalPlaces(matrix[r-1][c-1], 2);
                        }
                    }
                }

                return `<h4>Transiciónes ${props['name']}</h4>${createTableHtml(labeledMatrix)}`;
            },
            summary: (value: [FeatureCollection]) => {
                const matrix = Array.from(Array(5), _ => Array(5).fill(0));
                for (const feature of value[0].features) {
                    const fromDamageState = feature.properties['transitions']['from_damage_state'];
                    const nrBuildings = feature.properties['transitions']['n_buildings'];
                    const toDamageState = feature.properties['transitions']['to_damage_state'];
                    for (let i = 0; i < fromDamageState.length; i++) {
                        const r = fromDamageState[i];
                        const c = toDamageState[i];
                        const nr = nrBuildings[i];
                        matrix[r][c] += nr;
                    }
                }
                
                const labeledMatrix = Array.from(Array(matrix.length + 1), _ => Array(matrix.length + 1).fill(''));
                for (let r = 0; r < labeledMatrix.length; r++) {
                    for (let c = 0; c < labeledMatrix[0].length; c++) {
                        if (r === 0 && c === 0) {
                            labeledMatrix[r][c] = '<b>from/to</b>';
                        } else if (r === 0) {
                            labeledMatrix[r][c] = `<b>${c - 1}</b>`;
                        } else if (c === 0) {
                            labeledMatrix[r][c] = `<b>${r - 1}</b>`;
                        } else if (r > 0 && c > 0) {
                            labeledMatrix[r][c] = toDecimalPlaces(matrix[r-1][c-1], 2);
                        }
                    }
                }

                return createTableHtml(labeledMatrix);
            }
        },
        description: 'Change from previous state to current one'
    },
    value: null
};

export const eqUpdatedExposurePeru: VectorLayerData & WpsData & Product = {
    uid: 'updated_exposurePeru',
    description: {
        id: 'updated_exposure',
        reference: false,
        icon: 'dot-circle',
        type: 'complex',
        format: 'application/json',
        name: 'eq-exposure',
        vectorLayerAttributes: {
            style: (feature: olFeature, resolution: number) => {
                const props = feature.getProperties();

                const expo = props.expo;
                const counts = {
                    'D0': 0,
                    'D1': 0,
                    'D2': 0,
                    'D3': 0,
                    'D4': 0
                };
                let total = 0;
                for (let i = 0; i < expo.Damage.length; i++) {
                    const damageClass = expo.Damage[i];
                    const nrBuildings = expo.Buildings[i];
                    counts[damageClass] += nrBuildings;
                    total += nrBuildings;
                }

                const dr = damageRage(Object.values(counts));

                let r: number;
                let g: number;
                let b: number;
                if (total === 0) {
                    r = b = g = 0;
                } else {
                    [r, g, b] = redGreenRange(0, 1, dr);
                }

                return new olStyle({
                  fill: new olFill({
                    color: [r, g, b, 0.3],
                  }),
                  stroke: new olStroke({
                    color: [r, g, b, 1],
                    witdh: 2
                  })
                });
            },
            text: (props: object) => {
                const anchor = document.createElement('div');

                const expo = props['expo'];
                const counts = {
                    'D0': 0,
                    'D1': 0,
                    'D2': 0,
                    'D3': 0,
                    'D4': 0
                };
                for (let i = 0; i < expo.Damage.length; i++) {
                    const damageClass = expo.Damage[i];
                    const nrBuildings = expo.Buildings[i];
                    counts[damageClass] += nrBuildings;
                }
                const data: Bardata[] = [];
                for (const damageClass in counts) {
                    data.push({label: damageClass, value: counts[damageClass]});
                }
                const anchorUpdated = createBarchart(anchor, data, 500, 500, 'estado de daño', '# edificios');
                return `<h4>Exposición actualizada ${props['name']}</h4>${anchor.innerHTML}`;
            },
            summary: (value: [FeatureCollection]) => {
                const counts = {
                    'D0': 0,
                    'D1': 0,
                    'D2': 0,
                    'D3': 0,
                    'D4': 0
                };
                for (const feature of value[0].features) {
                    for (let i = 0; i < feature.properties.expo.Damage.length; i++) {
                        const damageClass = feature.properties.expo.Damage[i];
                        const nrBuildings = feature.properties.expo.Buildings[i];
                        counts[damageClass] += nrBuildings;
                    }
                }
                return createHeaderTableHtml(Object.keys(counts), [Object.values(counts).map(c => toDecimalPlaces(c, 2))]);
            }
        },
        description: 'Amount of goods that are exposed to a hazard.'
    },
    value: null
};

export const eqUpdatedExposureRefPeru: WpsData & Product = {
    uid: 'updated_exposure_ref_peru',
    description: {
        id: 'updated_exposure',
        reference: true,
        type: 'complex',
        format: 'application/json',
        description: 'Amount of goods that are exposed to a hazard.'
    },
    value: null
};



export class EqDeusPeru implements ExecutableProcess, WizardableProcess {

    readonly state: ProcessState;
    readonly uid: string;
    readonly name: string;
    readonly requiredProducts: string[];
    readonly providedProducts: string[];
    readonly description?: string;
    readonly wizardProperties: WizardProperties;

    private vulnerabilityProcess: VulnerabilityModelPeru;
    private deusProcess: Deus;

    constructor(http: HttpClient) {
        this.state = new ProcessStateUnavailable();
        this.uid = 'EQ-Deus';
        this.name = 'Multihazard damage estimation / EQ';
        this.requiredProducts = [eqShakemapRefPeru, initialExposurePeru].map(p => p.uid);
        this.providedProducts = [eqDamagePeru, eqTransitionPeru, eqUpdatedExposurePeru, eqUpdatedExposureRefPeru].map(p => p.uid);
        this.description = 'This service returns damage caused by the selected earthquake.';
        this.wizardProperties = {
            providerName: 'Helmholtz Centre Potsdam',
            providerUrl: 'https://www.gfz-potsdam.de/en/',
            shape: 'dot-circle' as 'dot-circle'
        };

        this.vulnerabilityProcess = new VulnerabilityModelPeru(http);
        this.deusProcess = new Deus(http);
    }

    execute(
        inputProducts: Product[],
        outputProducts?: Product[],
        doWhileExecuting?: (response: any, counter: number) => void): Observable<Product[]> {

        const vulnerabilityInputs = [
            assetcategoryPeru,
            losscategoryPeru,
            taxonomiesPeru,
            {
                ... schemaPeru,
                value: 'SARA_v1.0'
            }
        ];
        const vulnerabilityOutputs = [fragilityRefPeru];

        return this.vulnerabilityProcess.execute(vulnerabilityInputs, vulnerabilityOutputs, doWhileExecuting)
            .pipe(
                switchMap((resultProducts: Product[]) => {
                    const fragility = resultProducts.find(prd => prd.uid === fragilityRefPeru.uid);
                    const shakemap = inputProducts.find(prd => prd.uid === eqShakemapRefPeru.uid);
                    const exposure = inputProducts.find(prd => prd.uid === initialExposurePeru.uid);

                    const deusInputs = [{
                            ... schemaPeru,
                            value: 'SARA_v1.0'
                        }, {
                            ... fragility,
                            description: {
                                ... fragility.description,
                                id: 'fragility'
                            }
                        }, {
                            ... shakemap,
                            description: {
                                ...shakemap.description,
                                id: 'intensity'
                            }
                        }, {
                            ... exposure,
                            description: {
                                ... exposure.description,
                                id: 'exposure'
                            },
                            value: exposure.value[0]
                        }
                    ];
                    const deusOutputs = outputProducts;
                    return this.deusProcess.execute(deusInputs, deusOutputs, doWhileExecuting);
                })
            );
    }
}
