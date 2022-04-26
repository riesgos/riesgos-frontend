import { MappableProduct, WmsLayerProduct } from 'src/app/mappable/riesgos.datatypes.mappable';
import { WpsData } from '../../../services/wps/wps.datatypes';
import { Product, ProcessStateUnavailable, ExecutableProcess, ProcessState } from 'src/app/riesgos/riesgos.datatypes';
import { WizardableProcess, WizardProperties } from 'src/app/components/config_wizard/wizardable_processes';
import { tsShakemap } from './tsService';
import { HttpClient } from '@angular/common/http';
import { fragilityRef, VulnerabilityModel } from './modelProp';
import { forkJoin, Observable } from 'rxjs';
import { Deus } from './deus';
import { map, switchMap, take } from 'rxjs/operators';
import { StringSelectUserConfigurableProduct } from 'src/app/components/config_wizard/userconfigurable_wpsdata';
import { MapOlService } from '@dlr-eoc/map-ol';
import { LayersService } from '@dlr-eoc/services-layers';
import { LayerMarshaller } from 'src/app/mappable/layer_marshaller';
import { ProductLayer, ProductRasterLayer } from 'src/app/mappable/map.types';
import { Store } from '@ngrx/store';
import { State } from 'src/app/ngrx_register';
import { eqDamageMRef } from './eqDeus';
import { MapBrowserEvent } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { TileWMS } from 'ol/source';
import { DamagePopupComponent } from 'src/app/components/dynamic/damage-popup/damage-popup.component';
import { InfoTableComponentComponent } from 'src/app/components/dynamic/info-table-component/info-table-component.component';
import { TranslatableStringComponent } from 'src/app/components/dynamic/translatable-string/translatable-string.component';
import { toDecimalPlaces } from 'src/app/helpers/colorhelpers';
import { createHeaderTableHtml } from 'src/app/helpers/others';
import { EconomicDamagePopupComponent } from 'src/app/components/dynamic/economic-damage-popup/economic-damage-popup.component';



export const schema: StringSelectUserConfigurableProduct & WpsData = {
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
            // 'Medina_2019',
        ],
    },
    value: 'SUPPASRI2013_v2.0'
};


export const tsDamageMeta: WpsData & Product = {
    uid: 'chile_tsdamage_metadata',
    description: {
        id: 'meta_summary',
        reference: false,
        title: '',
        type: 'complex',
        format: 'application/json'
    },
    value: null
}

export const tsDamageWms: WpsData & MappableProduct = {
    uid: 'ts_deus_damage',
    description: {
        id: 'shapefile_summary',
        title: '',
        reference: false,
        type: 'complex',
        description: '',
        format: 'application/WMS',
    },
    toUkisLayers: function (ownValue: any, mapSvc: MapOlService, layerSvc: LayersService, httpClient: HttpClient, store: Store<State>, layerMarshaller: LayerMarshaller) {

        const riesgosState$ = store.select((state) => state.riesgosState).pipe(take(1));
        const layers$ = layerMarshaller.makeWmsLayers(this);

        return forkJoin([layers$, riesgosState$]).pipe(
            map(([layers, riesgosState]) => {

                const metaData = riesgosState.scenarioData['c1'].productValues.find(p => p.uid === tsDamageMeta.uid);
                const metaDataValue = metaData.value[0];

                const econLayer: ProductLayer = layers[0];
                const damageLayer: ProductLayer = new ProductRasterLayer({ ...econLayer });

                econLayer.id += '_economic';
                econLayer.name = 'ts-damage';
                econLayer.params.STYLES = 'style-cum-loss';
                econLayer.legendImg += '&style=style-cum-loss';
                const totalDamage = +(metaDataValue.total.loss_value);
                const totalDamageFormatted = toDecimalPlaces(totalDamage / 1000000, 0) + ' MUSD';
                econLayer.dynamicDescription = {
                    component: InfoTableComponentComponent,
                    inputs: {
                        title: 'Total damage',
                        data: [[{ value: 'Total damage' }, { value: totalDamageFormatted }]],
                        bottomText: `{{ damages_calculated_from }} <a href="./documentation#ExposureAndVulnerability" target="_blank">{{ replacement_costs }}</a>`
                    }
                }
                econLayer.popup = {
                    dynamicPopup: {
                        component: EconomicDamagePopupComponent,
                        getAttributes: (args) => {
                            const event: MapBrowserEvent<any> = args.event;
                            const layer: TileLayer<TileWMS> = args.layer;
                            return {
                                event: event,
                                layer: layer,
                                metaData: metaData.value[0],
                                title: 'ts-damage'
                            };
                        }
                    }
                }

                damageLayer.id += '_damage';
                damageLayer.name = 'ts-exposure';
                damageLayer.params = { ...econLayer.params };
                damageLayer.params.STYLES = 'style-damagestate-suppasri';
                damageLayer.legendImg += '&style=style-damagestate-suppasri';
                damageLayer.popup = {
                    dynamicPopup: {
                        component: DamagePopupComponent,
                        getAttributes: (args) => {
                            const event: MapBrowserEvent<any> = args.event;
                            const layer: TileLayer<TileWMS> = args.layer;
                            return {
                                event: event,
                                layer: layer,
                                metaData: metaData.value[0],
                                xLabel: 'damage',
                                yLabel: 'Nr_buildings',
                                schema: 'suppasri'
                            };
                        }
                    }
                };
                const counts = metaDataValue.total.buildings_by_damage_state;
                const html =
                    createHeaderTableHtml(Object.keys(counts), [Object.values(counts).map((c: number) => toDecimalPlaces(c, 0))])
                    + '{{ BuildingTypesSuppasri }}';

                damageLayer.dynamicDescription = {
                    component: TranslatableStringComponent,
                    inputs: {
                        text: html
                    }
                };


                return [econLayer, damageLayer];
            })
        );
    },
    value: null
}



export class TsDeus implements ExecutableProcess, WizardableProcess {

    readonly state: ProcessState;
    readonly uid: string;
    readonly name: string;
    readonly requiredProducts: string[];
    readonly providedProducts: string[];
    readonly description?: string;
    readonly wizardProperties: WizardProperties;

    private vulnerabilityProcess: VulnerabilityModel;
    private deusProcess: Deus;

    constructor(http: HttpClient) {
        this.state = new ProcessStateUnavailable();
        this.uid = 'TS-Deus';
        this.name = 'Multihazard_damage_estimation/Tsunami';
        this.requiredProducts = [tsShakemap, eqDamageMRef, schema].map(p => p.uid);
        this.providedProducts = [tsDamageWms, tsDamageMeta].map(p => p.uid);
        this.description = 'This service returns damage caused by the selected tsunami.';
        this.wizardProperties = {
            providerName: 'GFZ',
            providerUrl: 'https://www.gfz-potsdam.de/en/',
            shape: 'dot-circle',
            wikiLink: 'ExposureAndVulnerability'
        };

        this.vulnerabilityProcess = new VulnerabilityModel(http);
        this.deusProcess = new Deus(http);
    }

    execute(
        inputProducts: Product[],
        outputProducts?: Product[],
        doWhileExecuting?: (response: any, counter: number) => void): Observable<Product[]> {

        // Step 1.1: preparing vulnerability-service inputs
        const vulnerabilityInputs = [inputProducts.find(i => i.uid === schema.uid)];
        const vulnerabilityOutputs = [fragilityRef];

        // Step 1.2: executing vulnerability-service
        return this.vulnerabilityProcess.execute(vulnerabilityInputs, vulnerabilityOutputs, doWhileExecuting)
            .pipe(
                switchMap((resultProducts: Product[]) => {

                    // Step 2.1: preparing deus inputs
                    const fragility = resultProducts.find(prd => prd.uid === fragilityRef.uid);
                    const shakemap = inputProducts.find(prd => prd.uid === tsShakemap.uid);
                    const exposure = inputProducts.find(prd => prd.uid === eqDamageMRef.uid);

                    const deusInputs = [{
                        ...schema,
                        value: 'SARA_v1.0' // <-- because last exposure still used SARA!
                    }, {
                        ...fragility,
                        description: {
                            ...fragilityRef.description,
                            id: 'fragility'
                        }
                    }, {
                        ...shakemap,
                        description: {
                            ...shakemap.description,
                            format: 'text/xml',
                            id: 'intensity'
                        }
                    }, {
                        ...exposure,
                        description: {
                            ...exposure.description,
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
