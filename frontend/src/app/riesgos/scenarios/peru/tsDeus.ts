import { WmsLayerProduct } from 'src/app/riesgos/riesgos.datatypes.mappable';
import { WpsData } from '../../../services/wps/wps.datatypes';
import { Product, ProcessStateUnavailable, ExecutableProcess, ProcessState } from 'src/app/riesgos/riesgos.datatypes';
import { WizardableProcess, WizardProperties } from 'src/app/components/config_wizard/wizardable_processes';
import { eqDamagePeruMRef } from './eqDeus';
import { tsShakemapPeru } from './tsService';
import { HttpClient } from '@angular/common/http';
import { fragilityRefPeru, VulnerabilityModelPeru } from './modelProp';
import { Observable } from 'rxjs';
import { Deus } from '../chile/deus';
import { switchMap } from 'rxjs/operators';
import { StringSelectUserConfigurableProduct } from 'src/app/components/config_wizard/userconfigurable_wpsdata';


export const schemaPeru: StringSelectUserConfigurableProduct & WpsData = {
    uid: 'schema',
    description: {
        id: 'schema',
        title: 'schema',
        defaultValue: 'SUPPASRI2013_v2.0',
        reference: false,
        type: 'literal',
        wizardProperties: {
            fieldtype: 'stringselect',
            name: 'schema',
            description: '',
        },
        options: [
            'SUPPASRI2013_v2.0',
            'Medina_2019',
        ],
    },
    value: 'SUPPASRI2013_v2.0'
};




export const tsDamageWmsPeru: WpsData & WmsLayerProduct = {
    uid: 'ts_deus_damage_peru',
    description: {
        id: 'shapefile_summary',
        title: '',
        reference: false,
        type: 'complex',
        description: '',
        format: 'application/WMS',
        name: 'ts-exposure',
        styles: ['w_damage']
    },
    value: null
}

export const tsEconomicWmsPeru: WpsData & WmsLayerProduct = {
    uid: 'ts_deus_economic_peru',
    description: {
        id: 'shapefile_summary',
        title: '',
        reference: false,
        type: 'complex',
        description: '',
        format: 'application/WMS',
        name: 'ts-damage',
        styles: ['style']
    },
    value: null
}

export const tsTransitionWmsPeru: WpsData & WmsLayerProduct = {
    uid: 'ts_deus_transitions_peru',
    description: {
        id: 'shapefile_summary',
        title: '',
        reference: false,
        type: 'complex',
        description: '',
        format: 'application/WMS',
        name: 'ts-transitions',
        styles: ['m_trans']
    },
    value: null
}

export class TsDeusPeru implements ExecutableProcess, WizardableProcess {

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
        this.uid = 'TS-Deus';
        this.name = 'Multihazard_damage_estimation/Tsunami';
        this.requiredProducts = [schemaPeru, tsShakemapPeru, eqDamagePeruMRef].map(p => p.uid);
        this.providedProducts = [tsDamageWmsPeru, tsEconomicWmsPeru, tsTransitionWmsPeru].map(p => p.uid);
        this.description = 'This service returns damage caused by the selected tsunami.';
        this.wizardProperties = {
            providerName: 'GFZ',
            providerUrl: 'https://www.gfz-potsdam.de/en/',
            shape: 'dot-circle',
            wikiLink: 'ExposureAndVulnerability'
        };

        this.vulnerabilityProcess = new VulnerabilityModelPeru(http);
        this.deusProcess = new Deus(http);
    }

    execute(
        inputProducts: Product[],
        outputProducts?: Product[],
        doWhileExecuting?: (response: any, counter: number) => void): Observable<Product[]> {

        // Step 1.1: preparing vulnerability-service inputs
        const vulnerabilityInputs = [inputProducts.find(i => i.uid === schemaPeru.uid)];
        const vulnerabilityOutputs = [fragilityRefPeru];

        // Step 1.2: executing vulnerability-service
        return this.vulnerabilityProcess.execute(vulnerabilityInputs, vulnerabilityOutputs, doWhileExecuting)
            .pipe(
                switchMap((resultProducts: Product[]) => {

                    // Step 2.1: preparing deus inputs
                    const fragility = resultProducts.find(prd => prd.uid === fragilityRefPeru.uid);
                    const shakemap = inputProducts.find(prd => prd.uid === tsShakemapPeru.uid);
                    const exposure = inputProducts.find(prd => prd.uid === eqDamagePeruMRef.uid);

                    const deusInputs = [{
                        ... schemaPeru,
                        value: 'SARA_v1.0' // <-- because last exposure still used SARA!
                    }, {
                        ... fragility,
                        description: {
                            ...fragilityRefPeru.description,
                            id: 'fragility'
                        }
                    }, {
                        ... shakemap,
                        description: {
                            ...shakemap.description,
                            format: 'text/xml',
                            id: 'intensity'
                        }
                    }, {
                        ... exposure,
                        description: {
                            ... exposure.description,
                            id: 'exposure'
                        },
                    }
                    ];
                    const deusOutputs = outputProducts;

                    // Step 2.2: executing deus
                    return this.deusProcess.execute(deusInputs, deusOutputs, doWhileExecuting);
                })
            );
    }
}
